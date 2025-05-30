const details = () => ({
  id: 'Tdarr_Plugin_jordy_Upmix_Mono_to_Stereo',
  Stage: 'Pre-processing',
  Name: 'Upmix Mono Audio Tracks to Stereo',
  Type: 'Audio',
  Operation: 'Transcode',
  Description: 'This plugin converts mono audio tracks to stereo format using a high-quality upmixing algorithm. \n\n',
  Version: '2.2',
  Link: "https://github.com/jordanlambrecht",
  Tags: 'pre-processing,ffmpeg,audio only,configurable',
  Inputs: [
    {
      name: 'codecs',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter comma-separated list of audio codecs to process or leave blank for all codecs.
               \\nExample:\\n
               (leave blank for all codecs)
               
               \\nExample:\\n
               aac,mp3
               
               \\nExample:\\n
               ac3,eac3,dts`,
    },
    {
      name: 'stereo_width',
      type: 'string',
      defaultValue: '1.7',
      inputUI: {
        type: 'text',
      },
      tooltip: `Set the stereo width effect level (1.0-2.5).
     Higher values create more spatial separation.
     1.0 = minimal width
     1.7 = recommended for most content (balanced)
     2.5 = maximum width
     
     Uses the stereowiden filter for natural, efficient stereo conversion.`,
    },
    {
      name: 'audio_bitrate',
      type: 'string',
      defaultValue: 'Keep Original',
      inputUI: {
        type: 'dropdown',
        options: [
          'Keep Original',
          '128',
          '160',
          '192',
          '224',
          '256',
          '320'
        ],
      },
      tooltip: `Select output audio bitrate in kbps.
               'Keep Original' will attempt to maintain the same bitrate as the source.\\n
               Higher values provide better quality but larger file size.
               192 is recommended for most content.\\nSetting it to 'Keep Original' will be the fastest option.`,
    },
    {
      name: 'remove_original',
      type: 'boolean',
      defaultValue: true,
      inputUI: {
        type: 'dropdown',
        options: [
          'true',
          'false'
        ],
      },
      tooltip: `Choose whether to remove the original mono tracks.
               true = Only keep the new stereo tracks
               false = Keep both mono and stereo tracks
               \\nExample:\\n
               true`,
    },
    {
      name: 'languages',
      type: 'string',
      defaultValue: '',
      inputUI: {
        type: 'text',
      },
      tooltip: `Enter comma-separated list of language tags to filter (leave blank to process all languages).
               Must follow ISO-639-2 3 letter format. https://en.wikipedia.org/wiki/List_of_ISO_639-2_codes
               \\nExample:\\n
               eng
               
               \\nExample:\\n
               jpn,kor`,
    },
    {
      name: 'upmix_mode',
      type: 'string',
      defaultValue: 'Quality',
      inputUI: {
        type: 'dropdown',
        options: [
          'Quality',
          'Speed'
        ],
      },
      tooltip: `Select upmixing algorithm mode:
         'Quality' - Uses stereowiden filter for better spatial separation (recommended)
         'Speed' - Uses simple channel duplication for fastest processing`,
    },
  ],
});

const plugin = (file, librarySettings, inputs, otherArguments) => {
  const lib = require('../methods/lib')();
  inputs = lib.loadDefaultValues(inputs, details);
  
  const response = {
    processFile: false,
    preset: '',
    container: `.${file.container}`,
    handBrakeMode: false,
    FFmpegMode: true,
    reQueueAfter: false,
    infoLog: '',
  };

  // Check if file is a video
  if (file.fileMedium !== 'video') {
    response.infoLog += '☒ File is not video \n';
    response.processFile = false;
    return response;
  }

  // Parse inputs
  const codecs = inputs.codecs ? inputs.codecs.toLowerCase().trim() : '';
  const codecsToProcess = codecs === '' || codecs === 'all' ? [] : 
                          codecs.split(',').map(codec => codec.trim()).filter(codec => codec !== '');
  
  const stereoWidth = parseFloat(inputs.stereo_width || '1.7');
  // Clamp to reasonable range
  const safeWidth = Math.min(Math.max(stereoWidth, 1.0), 2.5);
  
  const useOriginalBitrate = inputs.audio_bitrate === 'Keep Original';
  const audioBitrate = useOriginalBitrate ? 0 : parseInt(inputs.audio_bitrate || '192', 10);
  // Ensure valid bitrate if not using original
  const safeAudioBitrate = useOriginalBitrate ? 0 : 
                         ([128, 160, 192, 224, 256, 320].includes(audioBitrate) ? audioBitrate : 192);
  
  // Parse remove_original option
  const removeOriginal = inputs.remove_original === true || inputs.remove_original === 'true';
  
  // Parse language tags
  const languagesToProcess = ((inputs.languages || '').toLowerCase().split(',')
    .map(lang => lang.trim())
    .filter(lang => lang !== ''));
  
  // Parse upmix mode
  const upmixMode = inputs.upmix_mode || 'Quality';
  const isSpeedMode = upmixMode === 'Speed';

  response.infoLog += `🧮 Parameters: Codecs=${codecs === '' ? 'all' : codecs}, Enhancement=${safeWidth}, `;
  response.infoLog += `Bitrate=${useOriginalBitrate ? 'Keep Original' : safeAudioBitrate + 'k'}, `;
  response.infoLog += `Remove Original=${removeOriginal}, `;
  response.infoLog += `Languages=${languagesToProcess.length > 0 ? languagesToProcess.join(',') : 'all'}, `;
  response.infoLog += `Upmix Mode=${upmixMode}, \n`;
  
  // Store all audio streams and their properties for reference
  const audioStreams = [];
  const monoStreamsToConvert = [];
  
  // Loop through all streams to identify audio streams and mono tracks to convert
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    const stream = file.ffProbeData.streams[i];
    
    // Check if stream is audio
    if (stream.codec_type && stream.codec_type.toLowerCase() === 'audio') {
      // Build a stream info object
      const streamInfo = {
        index: i,
        absoluteIndex: i,  // Preserve the absolute stream index for FFmpeg
        audioIndex: audioStreams.length,  // Track audio stream position
        codec: stream.codec_name ? stream.codec_name.toLowerCase() : '',
        channels: stream.channels || 0,
        bitrate: 0,
        language: '',
        title: '',
        default: stream.disposition?.default === 1,
        isMonoToConvert: false
      };
      
      // Get bitrate if available - try multiple paths for different FFmpeg versions
      try {
        if (stream.bit_rate) {
          streamInfo.bitrate = Math.round(parseInt(stream.bit_rate, 10) / 1000);
        } else if (stream.tags && stream.tags.BPS) {
          streamInfo.bitrate = Math.round(parseInt(stream.tags.BPS, 10) / 1000);
        }
      } catch (err) {
        // Bitrate info not available, use default
        streamInfo.bitrate = safeAudioBitrate;
      }
      
      // Get language tag
      try {
        if (stream.tags && stream.tags.language) {
          streamInfo.language = stream.tags.language;
        }
      } catch (err) {
        // Language tag doesn't exist
      }
      
      // Get title tag
      try {
        if (stream.tags && stream.tags.title) {
          streamInfo.title = stream.tags.title;
        }
      } catch (err) {
        // Title tag doesn't exist
      }
      
      // Check if this is a mono track to convert
      if (streamInfo.channels === 1) {
        // Check if we should process this track based on codec and language filters
        const codecMatches = codecs === '' || codecs === 'all' || codecsToProcess.includes(streamInfo.codec);
        const languageMatches = languagesToProcess.length === 0 || 
                              (streamInfo.language && languagesToProcess.includes(streamInfo.language.toLowerCase()));
        
        if (codecMatches && languageMatches) {
          streamInfo.isMonoToConvert = true;
          monoStreamsToConvert.push(streamInfo);
          
          response.infoLog += `☑ Will convert: audio track ${streamInfo.absoluteIndex} (${streamInfo.codec}, ${streamInfo.language || 'unknown'} language`;
          if (streamInfo.bitrate) {
            response.infoLog += `, ${streamInfo.bitrate}k`;
          }
          if (streamInfo.title) {
            response.infoLog += `, "${streamInfo.title}"`;
          }
          response.infoLog += `)\n`;
        } else {
          response.infoLog += `↪️ Skipping: mono track ${streamInfo.absoluteIndex} - doesn't match filters\n`;
        }
      } else {
        response.infoLog += `↪️ Skipping: audio track ${streamInfo.absoluteIndex} - already has ${streamInfo.channels} channels\n`;
      }
      
      // Add to audio streams array
      audioStreams.push(streamInfo);
    }
  }
  
  // Process file if mono tracks found to convert
  if (monoStreamsToConvert.length > 0) {
    response.processFile = true;
    
    try {
      // Base FFmpeg command with only compatible performance optimization
      let ffmpegCommand = '-threads 0 ';
      
      // Process each mono stream one at a time
      monoStreamsToConvert.forEach((stream, idx) => {
        // Define the stereowiden parameters - MOVED OUTSIDE THE CONDITIONAL
        // Calculate these parameters regardless of mode to fix variable scope issues
        const delay = Math.floor(5 + (safeWidth - 1) * 15);
        const feedback = Math.min(0.4, 0.2 + (safeWidth - 1) * 0.15).toFixed(2);
        const crossfeed = Math.max(0.1, 0.8 - ((safeWidth - 1) * 0.4)).toFixed(2);
        const drymix = Math.max(0.2, 1.5 - safeWidth * 0.4).toFixed(2);
        
        // Create the filter for this stream
        let filterString;
        
        if (isSpeedMode) {
          // Speed mode - simple duplication using channelmap
          filterString = `[0:${stream.absoluteIndex}]channelmap=1-mono|1-mono[stereo${idx}]`;
        } else {
          // Quality mode with stereowiden filter
          filterString = `[0:${stream.absoluteIndex}]pan=stereo|c0=c0|c1=c0,stereowiden=delay=${delay}:feedback=${feedback}:crossfeed=${crossfeed}:drymix=${drymix}[stereo${idx}]`;
        }
        
        // Set the bitrate for the output stream
        const bitrate = useOriginalBitrate ? (stream.bitrate || safeAudioBitrate) : safeAudioBitrate;
        
        // Create the modified title
        const newTitle = stream.title
          ? (stream.title.includes('Stereo') ? stream.title : `${stream.title} (Stereo)`)
          : 'Stereo';
        
        // Escape title properly for FFmpeg
        const escapedTitle = newTitle.replace(/"/g, '\\"');
        
        // Add to the command (process one mono stream at a time)
        if (removeOriginal) {
          // Replace original mono track with stereo version
          ffmpegCommand += `-filter_complex '${filterString}' `;
          ffmpegCommand += `-map 0 -map -0:${stream.absoluteIndex} -map '[stereo${idx}]' `;
          ffmpegCommand += `-c:v copy -c:s copy `;
          
          // Copy all audio streams except the one we're modifying
          for (let i = 0; i < audioStreams.length; i++) {
            if (i !== stream.audioIndex) {
              ffmpegCommand += `-c:a:${i} copy `;
            }
          }
          
          // Set codec and bitrate for the modified stream
          ffmpegCommand += `-c:a:${stream.audioIndex} aac -b:a:${stream.audioIndex} ${bitrate}k `;
          
          // Add metadata
          if (stream.language) {
            ffmpegCommand += `-metadata:s:a:${stream.audioIndex} language=${stream.language} `;
          }
          ffmpegCommand += `-metadata:s:a:${stream.audioIndex} title="${escapedTitle}" `;
          
          // Set default flag if original was default
          if (stream.default) {
            ffmpegCommand += `-disposition:a:${stream.audioIndex} default `;
          }
        } else {
          // Keep original and add new stereo track
          ffmpegCommand += `-filter_complex '${filterString}' `;
          ffmpegCommand += `-map 0 -map '[stereo${idx}]' `;
          ffmpegCommand += `-c:v copy -c:s copy `;
          
          // Copy all original audio streams
          for (let i = 0; i < audioStreams.length; i++) {
            ffmpegCommand += `-c:a:${i} copy `;
          }
          
          // Set codec and bitrate for the new stream
          ffmpegCommand += `-c:a:${audioStreams.length} aac -b:a:${audioStreams.length} ${bitrate}k `;
          
          // Add metadata
          if (stream.language) {
            ffmpegCommand += `-metadata:s:a:${audioStreams.length} language=${stream.language} `;
          }
          ffmpegCommand += `-metadata:s:a:${audioStreams.length} title="${escapedTitle}" `;
          
          // New stream won't be default unless we explicitly set it
          if (stream.default) {
            ffmpegCommand += `-disposition:a:${audioStreams.length} default -disposition:a:${stream.audioIndex} 0 `;
          }
        }
      });
      
      // Add to response
      response.preset = `, ${ffmpegCommand.trim()}`;
      
      // Update info log
      response.infoLog += `✅ Will convert ${monoStreamsToConvert.length} mono track(s) to stereo\n`;
      response.infoLog += `${removeOriginal ? '🔄 Original mono tracks will be removed' : '👍 Original mono tracks will be kept'}\n`;
      response.infoLog += `🔊 Using enhancement level: ${safeWidth}\n`;
      response.infoLog += `🔊 ${useOriginalBitrate ? 'Using original bitrates where available' : 'Using bitrate: ' + safeAudioBitrate + 'k'}\n`;
      response.infoLog += `⚡ Performance optimizations enabled: multi-threading\n`;
      response.infoLog += `🎧 Using ${isSpeedMode ? 'speed-optimized' : 'quality-optimized'} upmixing algorithm\n\n\n`;
      
      // Add final command preview for debugging
      response.infoLog += `Final command: ffmpeg -i input.mkv ${ffmpegCommand}`;
      
    } catch (error) {
      // Handle any errors during command construction
      response.infoLog += `❌ Error constructing FFmpeg command: ${error.message}\n`;
      response.processFile = false;
      
      // Log detailed error for debugging
      console.error('Error in Tdarr_Plugin_jordy_Upmix_Mono_to_Stereo:', error);
    }
  } else {
    response.infoLog += '✅ No mono tracks to convert\n';
  }
  
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;