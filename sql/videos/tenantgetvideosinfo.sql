
create or replace function tenantgetvideosinfo(
    _meta jsonb
) returns jsonb
    language plpgsql
as
$$
DECLARE
    _info text = '';
    J jsonb;


BEGIN
    if (key_exists(_meta::jsonb,'status') is true) then
        return ('{"audio":null,"video":null}')::jsonb;
    end if;
    for J in select jsonb_array_elements((_meta->>'streams')::jsonb) loop
            if ((J->>'codec_type')::text = 'video') then
                _info = _info || '"video":"'|| (J->>'width')::text || 'x' || (J->>'height')::text ||' | '|| (J->>'codec_name')::text ||' | '|| (J->>'display_aspect_ratio')::text ||'",';
                raise notice 'Info: %',_info;
            elsif ((J->>'codec_type')::text = 'audio') then
                _info = _info || '"audio":"'|| (J->>'codec_name')::text ||'|'|| (J->>'sample_rate')::text ||'",';
                raise notice 'Info: %',_info;
            end if;
        end loop;
    if (_info = '') then
        return ('{"audio":null,"video":null}')::jsonb;
    end if;
    _info = substring(_info,1,length(_info)-1);
    _info = '{"status":"success",'|| substring(_info,1,length(_info)) ||'}';
    raise notice 'Info: %',_info;
    return (_info)::jsonb;
END;
$$;

select tenantgetvideosinfo('{
  "format": {
    "size": 1403553065,
    "tags": {
      "date": "2024",
      "title": "👲Garfield y sus amigos van a China! 🐼- El Show de Garfield",
      "artist": "GARFIELD SHOW ESPAÑOL LATINO - CANAL OFICIAL",
      "comment": "https://www.youtube.com/watch?v=B1O3h73Mr3o",
      "encoder": "Lavf58.39.101",
      "major_brand": "isom",
      "minor_version": "512",
      "compatible_brands": "isomiso2avc1mp41"
    },
    "bit_rate": 1698093,
    "duration": 6612.37,
    "filename": "/mnt/channels/live2/infantiles_garfield/01_garfield.mp4",
    "nb_streams": 2,
    "start_time": 0,
    "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
    "nb_programs": 0,
    "probe_score": 100,
    "format_long_name": "QuickTime / MOV"
  },
  "streams": [{
    "id": "N/A",
    "refs": 1,
    "tags": {
      "language": "und",
      "handler_name": "ISO Media file produced by Google Inc."
    },
    "index": 0,
    "level": 40,
    "width": 1920,
    "height": 1080,
    "is_avc": "true",
    "pix_fmt": "yuv420p",
    "profile": "High",
    "bit_rate": 1563887,
    "duration": 6612.32,
    "timecode": "N/A",
    "codec_tag": "0x31637661",
    "nb_frames": 165308,
    "start_pts": 0,
    "time_base": "1/12800",
    "codec_name": "h264",
    "codec_type": "video",
    "start_time": 0,
    "coded_width": 1920,
    "color_range": "tv",
    "color_space": "bt709",
    "disposition": {
      "dub": 0,
      "forced": 0,
      "lyrics": 0,
      "comment": 0,
      "default": 1,
      "karaoke": 0,
      "original": 0,
      "attached_pic": 0,
      "clean_effects": 0,
      "visual_impaired": 0,
      "hearing_impaired": 0,
      "timed_thumbnails": 0
    },
    "duration_ts": 84637696,
    "field_order": "unknown",
    "coded_height": 1088,
    "has_b_frames": 1,
    "max_bit_rate": "N/A",
    "r_frame_rate": "25/1",
    "avg_frame_rate": "25/1",
    "color_transfer": "bt709",
    "nb_read_frames": "N/A",
    "chroma_location": "left",
    "codec_long_name": "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
    "codec_time_base": "1/50",
    "color_primaries": "bt709",
    "nal_length_size": 4,
    "nb_read_packets": "N/A",
    "codec_tag_string": "avc1",
    "bits_per_raw_sample": 8,
    "sample_aspect_ratio": "1:1",
    "display_aspect_ratio": "16:9"
  }, {
    "id": "N/A",
    "tags": {
      "language": "eng",
      "handler_name": "ISO Media file produced by Google Inc."
    },
    "index": 1,
    "profile": "LC",
    "bit_rate": 127999,
    "channels": 2,
    "duration": 6612.369705,
    "codec_tag": "0x6134706d",
    "nb_frames": 284771,
    "start_pts": 0,
    "time_base": "1/44100",
    "codec_name": "aac",
    "codec_type": "audio",
    "sample_fmt": "fltp",
    "start_time": 0,
    "disposition": {
      "dub": 0,
      "forced": 0,
      "lyrics": 0,
      "comment": 0,
      "default": 1,
      "karaoke": 0,
      "original": 0,
      "attached_pic": 0,
      "clean_effects": 0,
      "visual_impaired": 0,
      "hearing_impaired": 0,
      "timed_thumbnails": 0
    },
    "duration_ts": 291605504,
    "sample_rate": 44100,
    "max_bit_rate": 127999,
    "r_frame_rate": "0/0",
    "avg_frame_rate": "0/0",
    "channel_layout": "stereo",
    "nb_read_frames": "N/A",
    "bits_per_sample": 0,
    "codec_long_name": "AAC (Advanced Audio Coding)",
    "codec_time_base": "1/44100",
    "nb_read_packets": "N/A",
    "codec_tag_string": "mp4a",
    "bits_per_raw_sample": "N/A"
  }
  ],
  "chapters": []
}');

select key_exists('{
  "format": {
    "size": 1403553065,
    "tags": {
      "date": "2024",
      "title": "👲Garfield y sus amigos van a China! 🐼- El Show de Garfield",
      "artist": "GARFIELD SHOW ESPAÑOL LATINO - CANAL OFICIAL",
      "comment": "https://www.youtube.com/watch?v=B1O3h73Mr3o",
      "encoder": "Lavf58.39.101",
      "major_brand": "isom",
      "minor_version": "512",
      "compatible_brands": "isomiso2avc1mp41"
    },
    "bit_rate": 1698093,
    "duration": 6612.37,
    "filename": "/mnt/channels/live2/infantiles_garfield/01_garfield.mp4",
    "nb_streams": 2,
    "start_time": 0,
    "format_name": "mov,mp4,m4a,3gp,3g2,mj2",
    "nb_programs": 0,
    "probe_score": 100,
    "format_long_name": "QuickTime / MOV"
  },
  "streams": [{
    "id": "N/A",
    "refs": 1,
    "tags": {
      "language": "und",
      "handler_name": "ISO Media file produced by Google Inc."
    },
    "index": 0,
    "level": 40,
    "width": 1920,
    "height": 1080,
    "is_avc": "true",
    "pix_fmt": "yuv420p",
    "profile": "High",
    "bit_rate": 1563887,
    "duration": 6612.32,
    "timecode": "N/A",
    "codec_tag": "0x31637661",
    "nb_frames": 165308,
    "start_pts": 0,
    "time_base": "1/12800",
    "codec_name": "h264",
    "codec_type": "video",
    "start_time": 0,
    "coded_width": 1920,
    "color_range": "tv",
    "color_space": "bt709",
    "disposition": {
      "dub": 0,
      "forced": 0,
      "lyrics": 0,
      "comment": 0,
      "default": 1,
      "karaoke": 0,
      "original": 0,
      "attached_pic": 0,
      "clean_effects": 0,
      "visual_impaired": 0,
      "hearing_impaired": 0,
      "timed_thumbnails": 0
    },
    "duration_ts": 84637696,
    "field_order": "unknown",
    "coded_height": 1088,
    "has_b_frames": 1,
    "max_bit_rate": "N/A",
    "r_frame_rate": "25/1",
    "avg_frame_rate": "25/1",
    "color_transfer": "bt709",
    "nb_read_frames": "N/A",
    "chroma_location": "left",
    "codec_long_name": "H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10",
    "codec_time_base": "1/50",
    "color_primaries": "bt709",
    "nal_length_size": 4,
    "nb_read_packets": "N/A",
    "codec_tag_string": "avc1",
    "bits_per_raw_sample": 8,
    "sample_aspect_ratio": "1:1",
    "display_aspect_ratio": "16:9"
  }, {
    "id": "N/A",
    "tags": {
      "language": "eng",
      "handler_name": "ISO Media file produced by Google Inc."
    },
    "index": 1,
    "profile": "LC",
    "bit_rate": 127999,
    "channels": 2,
    "duration": 6612.369705,
    "codec_tag": "0x6134706d",
    "nb_frames": 284771,
    "start_pts": 0,
    "time_base": "1/44100",
    "codec_name": "aac",
    "codec_type": "audio",
    "sample_fmt": "fltp",
    "start_time": 0,
    "disposition": {
      "dub": 0,
      "forced": 0,
      "lyrics": 0,
      "comment": 0,
      "default": 1,
      "karaoke": 0,
      "original": 0,
      "attached_pic": 0,
      "clean_effects": 0,
      "visual_impaired": 0,
      "hearing_impaired": 0,
      "timed_thumbnails": 0
    },
    "duration_ts": 291605504,
    "sample_rate": 44100,
    "max_bit_rate": 127999,
    "r_frame_rate": "0/0",
    "avg_frame_rate": "0/0",
    "channel_layout": "stereo",
    "nb_read_frames": "N/A",
    "bits_per_sample": 0,
    "codec_long_name": "AAC (Advanced Audio Coding)",
    "codec_time_base": "1/44100",
    "nb_read_packets": "N/A",
    "codec_tag_string": "mp4a",
    "bits_per_raw_sample": "N/A"
  }
  ],
  "chapters": []
}','status');


/*
            if ((J->>'codec_type')::text = 'video') then
                _info = _info || '"video":{"codec":"'|| (J->>'codec_name')::text ||'"' ||
                        ',"display_aspect_ratio":"'|| (J->>'display_aspect_ratio')::text ||'"' ||
                        ',"resolution":"'|| (J->>'width')::text || 'x' || (J->>'height')::text ||'"},';
                raise notice 'Info: %',_info;
            elsif ((J->>'codec_type')::text = 'audio') then
                _info = _info || '"audio":{"codec":"'|| (J->>'codec_name')::text ||'"' ||
                        ',"sample_rate":"'|| (J->>'sample_rate')::text ||'"' ||
                        ',"channels":'|| (J->>'channels')::text ||'},';
                raise notice 'Info: %',_info;
            end if;
        end loop;*/