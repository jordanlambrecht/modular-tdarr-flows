# CHANGELOG

## v2.0.0 - May 30, 2025

There are a lot of breaking changes in this update. I highly recommend reading
through them all and running test videos on your flows before using with actual
content.

### Added

- `keep_8ch_audio` library variable. Defaults to false. This variable is
  optional.
- `remove_commentary` library variable. Defaults to false. Setting to true will
  remove any audio tracks that are flagged as commentary. This variable is
  optional. Executed in the Audio Cleaning flow.
- Audio Transcoding flow will now automatically upmix mono tracks to stereo and
  remove the mono track.
- Cleanup now changes file perms if `enable_unraid` is set to `true`
- New flow!! Early logic and safety considerations have been added to a flow
  called `👋 Initialization`. It can be activated using the variable
  `enable_initialization`
- `audio transcoding` flow now fails at the `Create 2-channel aac (jp)` and
  `Create 2-channel aac (en)` steps because 2ch AAC is _mandatory_. **Further
  investigation is required for 'en' vs 'eng' and 'jp' vs 'jpn' language
  codes.**
- Safety checks in the `audio transcoding` flow to ensure that a valid audio
  codec is found before scrubbing unwanted ones. This was put in place due to
  rare cases where mp2 2ch audio was not transcoding to aac 2ch and was being
  removed instead, leaving no audio track at all.
- `audio transcoding` now checks for dubs to transcode in addition to japanese
  (for anime)
- New logic for detecting external and/or unwanted subtitle types. This is still
  shaky since Tdarr does not have great subtitle handling logic. Please report
  any issues you find with subtitles.
- Added new `nvenc_preset` variable to the `video transcoding` flow. This is
  used to set the preset for the NVENC encoder. Defaults to `p7`. Nvenc encoding
  now uses
  `-c:0 hevc_nvenc -preset p{{{args.variables.user.use_nvenc_preset}}} -tune hq -spatial-aq 1 -temporal-aq 1 -rc-lookahead 32 -no-scenecut 1 -qmin 0 -g 250 -bf 3 -b_ref_mode middle -b_adapt 0 -fps_mode passthrough -i_qfactor 0.75 -b_qfactor 1.1`

### Changed

- Audio transcoding now removes 8ch streams by default now
- Audio transcoding now removes any AAC codecs from 6ch streams, leaving only
  AC3
- Better audio codec removal logic
- `Video Transcoding` flow now checks for small h265 movie files and does not
  transcode them if they're under 4.5gb. This is to prevent unnecessary
  transcoding of small files that are already in a good format.
- `Video Transcoding` flow now renders 480p and 576p videos as 480p instead of
  up converting them to 720p. This is to prevent unnecessary upscaling of videos
  that are already in a good format.

### Fixed

- Issue with Keep Native Lang Plus Eng (anime) plugin not working. This was due
  to the global variable being used with http://, but the plugin does not want
  http:// in it's input field. See Issue #11
- Missing emoji in the subtitle flow lol
- Issue with 480p videos upscaling to 1080p

### BREAKING

- I wrote 3x custom community plugins to handle the AAC 6ch removal logic.
  Please see this
  [pull request](https://github.com/HaveAGitGat/Tdarr_Plugins/pull/811). Until
  it is merged, you will need to create custom plugins into it. Please open an
  issue if you run into trouble. Referr to the [[🕹️ Custom Plugins]] wiki page
  for detailed setup instructions
- I also wrote a custom community plugin to upmix mono tracks to stereo. Until
  it is merged, you will need to create a custom plugin and copy/paste
  [this code](https://github.com/jordanlambrecht/Tdarr_Plugins/blob/upmix_mono_to_stereo/Community/Tdarr_Plugin_jordy_Upmix_Mono_to_Stereo.js)
  into it. Referr to the [[🕹️ Custom Plugins]] wiki page for detailed setup
  instructions
- I also wrote a custom community plugin to filter specifically by audio codec
  AND audio channel. Same deal.
  [Github repo here](https://github.com/jordanlambrecht/Tdarr_Plugins/blob/filter_by_audio_codec_and_channels/Community/Tdarr_Plugin_jordy_filter_by_audio_codec_and_channels.js).
  Referr to the [[🕹️ Custom Plugins]] wiki page for detailed setup instructions
- Sonarr/Radarr IP addresses in the global config MUST NOT contain http:// or
  https:// anymore. Please update your global variables accordingly.

## v1.2.0 - March 4, 2025

### Added

- Emojis to subtitles flow
- Comments indicating which plugins to bypass for single-node setups
- Better error handling. Multiple 'reset flow errors' have been added so
  progress can continue even if some steps fail.
- File size check for movies/kids movies. Tdarr will now hold for review if a
  movie is already under 4.25gb.

### Removed

- Disabled 'Add local subtitles' plugin from the subtitles cleaning flow. It
  errors out no matter what, so removing it for now.

## v1.0.1 - March 2, 2025

### Added

- `use_checkpoints` variable for overwriting source files after each flow is
  complete
- `check_hardlinks` variable to filter out any files that may be used other
  places that we don't want to touch
- Created the changelog file you're reading right now
- Updated README to include info about new variables

### Changed

- Updated flow titles to include emoji
- Added indicator emojis to controller, notification, and cleanup flow plugins
- Moved cleanup logic to its own flow
-

### Fixed

- Minor grid layout cleanup
