# Modular Tdarr Flows

> _She's built like a steakhouse but handles like a Bistro_

The overall goal of this project is to be able to controll advanced flows
completely via a handful of library variables. In a perfect world, you should
never need to touch any of the flows.

The idea is that the entire system is 'modular.' That meaning that I can tweak a
handful of library variables to best suit the media I want to transcode. For
example, some pieces of media I might only want to clean the subtitles on and
that's it, and others I might want to go ham on and run a full transcode.

> # 🚨🚨 BREAKING CHANGE: AS OF v2.0.0 YOU **MUST** INSTALL CUSTOM PLUGINS. SEE CHANGELOG AND WIKI FOR MORE DETAILS AND INSTRUCTIONS.🚨🚨

## The Perfect File

If all of the stars perfectly line up (they rarely do) a 100% complete file
would look like this

### Ideal Regular TV Show/Movie File

| Stream         | Type      | Codec/Format | Details            |
| -------------- | --------- | ------------ | ------------------ |
| **Container:** | **MKV**   |              |                    |
| Stream 0       | Video     | HEVC/H.265   |                    |
| Stream 1       | Audio     | AC3          | 5.1ch, English     |
| Stream 2       | Audio     | AAC          | 2.0ch, English     |
| Stream 3       | Audio     | AAC          | 2.0ch (Commentary) |
| Stream 4       | Subtitles | SRT          | English            |
| Stream 5       | Subtitles | SRT          | English (Forced)   |

### Ideal Anime File

| Stream         | Type      | Codec/Format | Details                        |
| -------------- | --------- | ------------ | ------------------------------ |
| **Container:** | **MKV**   |              |                                |
| Stream 0       | Video     | HEVC/H.265   |                                |
| Stream 1       | Audio     | AC3          | 5.1ch, Japanese/Native         |
| Stream 2       | Audio     | AC3          | 5.1ch, English Dub             |
| Stream 3       | Audio     | AAC          | 2.0ch, Japanese/Native         |
| Stream 4       | Audio     | AAC          | 2.0ch, English Dub             |
| Stream 5       | Audio     | AAC          | 2.0ch (Commentary, songs, etc) |
| Stream 6       | Subtitles | SRT          | English                        |
| Stream 7       | Subtitles | SRT          | English (Forced)               |
| Stream 8       | Subtitles | SRT          | Japanese                       |

## Setup

Check the
[wiki](https://github.com/jordanlambrecht/modular-tdarr-flows/wiki/%F0%9F%A7%B0-Setup-Instructions)
for setup instructions.

## 🧮 Variables

At the core functionality of our modular system are variables. They drive all
aspects of our flows and keep you from having to need to hunt down and tinker
with 100s of plugin settings.

See
[this wiki page](https://github.com/jordanlambrecht/modular-tdarr-flows/wiki/%F0%9F%A7%AE-Variables)
for instructions on variable setup.

Commentary is not removed by default.

## Customizing for Your Personal Setup

Since I take advantage of three nodes (two mac, one PC), I have a few logic
flows specific to my setup. If you have a different setup or only use one node,
you'll have to adjust these flows accordingly. I've added comments on the flows
to help pinpoint which ones need to be adjusted.

## ToDo

- ~~Add support for commentary filtering (low priority)~~ ✅ Done!
- Add optional library variables for FileSizeLowerBoundsCheck and
  FileSizeUpperBoundsCheck (high priority)
- Add additional emoji indicators unique to each flow state (high priority)
- Add a way to specify the target audio format (e.g., AC3, AAC) (low priority)
  or something like KeepAc3
- ~~Add variable to set the maximum number of audio channels to keep (low
  priority)~~ ✅ Done! Kind of. We now only keep 5.1 and 2ch
- Add optional variable to enable Loudnorm processing (medium priority)
- ~~Add 'checkpoint' file overwrites. If enabled, the controller flow will
  overwrite the original file after each module. For example, if audio
  transcoding is successful but video transcoding fails, the audio transcoding
  will have already overwritten the original file. When we retry the flow, it
  will bypass all the work needed for audio transcoding and go directly to video
  transcoding, saving time/resources.~~ ✅ Done!
- Change variable names to camelCase (low priority)
- Replace images in /docs with updated screenshots (high priority)
- Add additional documentation for checkpoint and hardlink variables/logic

## Contributing

There are a lot of moving parts to this project. Since this isn't a typical
repo, and the JSON files are extremely large and hard to maintain, the best
approach to contributing is to open an issue for each modification you have and
provide a detailed list of changes along with a screenshot of the relative flow
location.

Creating pull requests is still acceptable, but they may not be merged if my
local version is ahead of the main release version. Pull requests should have
the same detailed information.

Advice for optimal encoding settings or alternative logic is always welcome.

## License

GNU General Public License v3.0
