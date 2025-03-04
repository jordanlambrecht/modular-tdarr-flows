# CHANGELOG

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
