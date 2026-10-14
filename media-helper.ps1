# BloxCool media helper (Windows only).
# Reads the Windows media session (the Spotify app, browsers, ...) and controls it.
# Protocol: one command per line on stdin, exactly one JSON line per command on stdout.
#   poll | poll:full | toggle | next | prev | seek:<ms> | vol:get | vol:set:<0..1> | quit

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

$script:lastKey = ''
$script:lastThumb = ''
$script:thumbTries = 0
$script:thumbSent = $false
$script:thumbErr = ''
$script:volReady = $null

# C# for per-app volume through the Windows Core Audio API. Compiled lazily on the first volume command,
# inside a try/catch, so a failure here can never break now-playing or the controls.
$csharp = @"
using System;
using System.Runtime.InteropServices;

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
class MMDeviceEnumeratorComObject { }

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
  int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
  int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
  int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object iface);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionManager2 {
  int GetAudioSessionControl(IntPtr a, int b, out IntPtr c);
  int GetSimpleAudioVolume(IntPtr a, int b, out IntPtr c);
  int GetSessionEnumerator(out IAudioSessionEnumerator sessionEnum);
}

[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionEnumerator {
  int GetCount(out int count);
  int GetSession(int index, out IAudioSessionControl2 session);
}

[Guid("bfb7ff88-7239-4fc9-8fa2-07c950be9c6d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IAudioSessionControl2 {
  int GetState(out int state);
  int GetDisplayName([MarshalAs(UnmanagedType.LPWStr)] out string name);
  int SetDisplayName([MarshalAs(UnmanagedType.LPWStr)] string name, ref Guid ctx);
  int GetIconPath([MarshalAs(UnmanagedType.LPWStr)] out string path);
  int SetIconPath([MarshalAs(UnmanagedType.LPWStr)] string path, ref Guid ctx);
  int GetGroupingParam(out Guid g);
  int SetGroupingParam(ref Guid g, ref Guid ctx);
  int RegisterAudioSessionNotification(IntPtr n);
  int UnregisterAudioSessionNotification(IntPtr n);
  int GetSessionIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
  int GetSessionInstanceIdentifier([MarshalAs(UnmanagedType.LPWStr)] out string id);
  int GetProcessId(out int pid);
  int IsSystemSoundsSession();
  int SetDuckingPreference(bool optOut);
}

[Guid("87CE5498-68D6-44E5-9215-6DA47EF883D8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface ISimpleAudioVolume {
  int SetMasterVolume(float level, ref Guid ctx);
  int GetMasterVolume(out float level);
  int SetMute(bool mute, ref Guid ctx);
  int GetMute(out bool mute);
}

public static class SpotifyVolume {
  // level < 0 means "just read". Returns the volume (0..1), or -1 if the app has no audio session.
  public static float Apply(string proc, float level) {
    IMMDeviceEnumerator en = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
    IMMDevice dev;
    en.GetDefaultAudioEndpoint(0, 1, out dev);
    Guid iid = new Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F");
    object o;
    dev.Activate(ref iid, 23, IntPtr.Zero, out o);
    IAudioSessionManager2 mgr = (IAudioSessionManager2)o;
    IAudioSessionEnumerator sessions;
    mgr.GetSessionEnumerator(out sessions);
    int n;
    sessions.GetCount(out n);
    float result = -1f;
    for (int i = 0; i < n; i++) {
      IAudioSessionControl2 c;
      sessions.GetSession(i, out c);
      int pid;
      c.GetProcessId(out pid);
      string name = "";
      try { name = System.Diagnostics.Process.GetProcessById(pid).ProcessName; } catch { }
      if (string.Equals(name, proc, StringComparison.OrdinalIgnoreCase)) {
        ISimpleAudioVolume v = (ISimpleAudioVolume)c;
        if (level >= 0f) {
          Guid g = Guid.Empty;
          v.SetMasterVolume(level, ref g);
        }
        float cur;
        v.GetMasterVolume(out cur);
        result = cur;
      }
    }
    return result;
  }
}
"@

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
})[0]

# Waits for a Windows Runtime async operation and returns its result.
function Await($op, $type) {
  $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($op))
  $null = $task.Wait(-1)
  return $task.Result
}

try {
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.IRandomAccessStreamReference, Windows.Storage.Streams, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
  $null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
  $mgr = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
} catch {
  [Console]::Out.WriteLine((@{ fatal = "init: $($_.Exception.Message)" } | ConvertTo-Json -Compress))
  [Console]::Out.Flush()
  exit 1
}

# Prefer the Spotify app; otherwise whatever Windows considers the current media session.
function Get-Target {
  foreach ($s in $mgr.GetSessions()) {
    if ($s.SourceAppUserModelId -match 'spotify') { return $s }
  }
  return $mgr.GetCurrentSession()
}

function Get-Thumb($props) {
  $script:thumbErr = ''
  if ($null -eq $props.Thumbnail) { $script:thumbErr = 'no thumbnail'; return '' }
  $stream = $null
  try {
    $stream = Await ($props.Thumbnail.OpenReadAsync()) ([Windows.Storage.Streams.IRandomAccessStreamWithContentType])
  } catch {
    $script:thumbErr = 'open: ' + $_.Exception.Message
    return ''
  }
  $bytes = $null
  # Method 1: pure Windows Runtime DataReader. Some apps (Spotify) report Size = 0 for the cover stream
  # even though it has data, so read up to 4 MB regardless of the reported size.
  try {
    $size = [uint32]$stream.Size
    $want = if ($size -gt 0) { $size } else { [uint32]4000000 }
    $in = $stream
    try { $in = $stream.GetInputStreamAt([uint64]0) } catch { $in = $stream }
    $reader = [Windows.Storage.Streams.DataReader]::new($in)
    $got = Await ($reader.LoadAsync($want)) ([uint32])
    if ($got -gt 0) {
      $buf = New-Object byte[] $got
      $reader.ReadBytes($buf)
      $bytes = $buf
    } else {
      $script:thumbErr = 'reader: stream empty (size ' + $size + ')'
    }
  } catch {
    $script:thumbErr = 'reader: ' + $_.Exception.Message
  }
  # Method 2: .NET stream bridge
  if ($null -eq $bytes) {
    try {
      $net = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead([Windows.Storage.Streams.IRandomAccessStream]$stream)
      $ms = New-Object System.IO.MemoryStream
      $net.CopyTo($ms)
      $bytes = $ms.ToArray()
      $net.Dispose()
    } catch {
      $script:thumbErr = $script:thumbErr + ' | netstream: ' + $_.Exception.Message
    }
  }
  try { $stream.Dispose() } catch { }
  if ($null -eq $bytes -or $bytes.Length -lt 16) { return '' }
  $script:thumbErr = ''
  $mime = 'image/jpeg'
  if ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50) { $mime = 'image/png' }
  return ('data:' + $mime + ';base64,' + [Convert]::ToBase64String($bytes))
}

function Poll {
  $s = Get-Target
  if ($null -eq $s) { return @{ ok = $true; active = $false } }
  $props = Await ($s.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
  $tl = $s.GetTimelineProperties()
  $pb = $s.GetPlaybackInfo()

  $key = "$($props.Artist)|$($props.Title)|$($props.AlbumTitle)"
  if ($key -ne $script:lastKey) {
    $script:lastKey = $key
    $script:lastThumb = ''
    $script:thumbTries = 0
    $script:thumbSent = $false
  }
  if ($script:lastThumb -eq '' -and $script:thumbTries -lt 40) {
    $script:thumbTries++
    $script:lastThumb = Get-Thumb $props
  }

  $age = ([DateTimeOffset]::UtcNow - $tl.LastUpdatedTime).TotalMilliseconds
  if ($age -lt 0 -or $age -gt 21600000) { $age = 0 }

  $out = @{
    ok       = $true
    active   = $true
    key      = $key
    title    = [string]$props.Title
    artist   = [string]$props.Artist
    album    = [string]$props.AlbumTitle
    playing  = ([string]$pb.PlaybackStatus -eq 'Playing')
    position = [int64]$tl.Position.TotalMilliseconds
    duration = [int64](($tl.EndTime - $tl.StartTime).TotalMilliseconds)
    age      = [int64]$age
    canSeek  = [bool]$pb.Controls.IsPlaybackPositionEnabled
    app      = [string]$s.SourceAppUserModelId
  }
  # The cover is sent once per track (it is big), not on every poll.
  if (-not $script:thumbSent -and $script:lastThumb -ne '') {
    $out.thumb = $script:lastThumb
    $script:thumbSent = $true
  }
  if ($script:lastThumb -eq '' -and $script:thumbErr -ne '') { $out.thumbErr = $script:thumbErr }
  return $out
}

function Do-Cmd($cmd) {
  $s = Get-Target
  if ($null -eq $s) { return @{ ok = $false; error = 'nosession' } }
  $r = $false
  if ($cmd -eq 'toggle') {
    $r = Await ($s.TryTogglePlayPauseAsync()) ([bool])
  } elseif ($cmd -eq 'next') {
    $r = Await ($s.TrySkipNextAsync()) ([bool])
  } elseif ($cmd -eq 'prev') {
    $r = Await ($s.TrySkipPreviousAsync()) ([bool])
  } elseif ($cmd -match '^seek:(\d+)$') {
    $ticks = [int64]$Matches[1] * 10000
    $r = Await ($s.TryChangePlaybackPositionAsync($ticks)) ([bool])
  } else {
    return @{ ok = $false; error = 'badcmd' }
  }
  return @{ ok = [bool]$r }
}

function Ensure-Vol {
  if ($null -eq $script:volReady) {
    try {
      Add-Type -TypeDefinition $csharp
      $script:volReady = $true
    } catch {
      $script:volReady = $false
    }
  }
  return $script:volReady
}

function Do-Vol($cmd) {
  if (-not (Ensure-Vol)) { return @{ ok = $false; error = 'volume-unsupported' } }
  $level = -1.0
  if ($cmd -match '^vol:set:([0-9.]+)$') { $level = [double]$Matches[1] }
  $v = [SpotifyVolume]::Apply('Spotify', [single]$level)
  if ($v -lt 0) { return @{ ok = $false; error = 'novolume' } }
  return @{ ok = $true; volume = [math]::Round($v, 3) }
}

[Console]::Out.WriteLine('{"ready":true}')
[Console]::Out.Flush()

while ($true) {
  $line = [Console]::In.ReadLine()
  if ($null -eq $line) { break }
  $line = $line.Trim()
  if ($line -eq 'quit') { break }
  if ($line -eq '') { continue }
  try {
    if ($line -eq 'poll') {
      $out = Poll
    } elseif ($line -eq 'poll:full') {
      $script:thumbSent = $false
      $out = Poll
    } elseif ($line -like 'vol:*') {
      $out = Do-Vol $line
    } else {
      $out = Do-Cmd $line
    }
  } catch {
    $out = @{ ok = $false; error = [string]$_.Exception.Message }
  }
  [Console]::Out.WriteLine(($out | ConvertTo-Json -Compress -Depth 3))
  [Console]::Out.Flush()
}
