export const wd14_process = ({ client_id, load_img }: any) => {
  return {
    client_id: client_id,
    prompt: {
      '1': {
        inputs: {
          model: 'wd-v1-4-moat-tagger-v2',
          threshold: 0.2,
          character_threshold: 0.85,
          replace_underscore: false,
          trailing_comma: false,
          exclude_tags: 'sky,blue_sky,scenery',
          tags: '',
          image: ['2', 0],
        },
        class_type: 'WD14Tagger|pysssss',
      },
      '2': { inputs: { image: load_img, upload: 'image' }, class_type: 'LoadImage' },
    },
    extra_data: {
      extra_pnginfo: {
        workflow: {
          last_node_id: 2,
          last_link_id: 1,
          nodes: [
            {
              id: 1,
              type: 'WD14Tagger|pysssss',
              pos: [-827, 695],
              size: { '0': 335.5504455566406, '1': 324.76617431640625 },
              flags: {},
              order: 1,
              mode: 0,
              inputs: [{ name: 'image', type: 'IMAGE', link: 1, slot_index: 0 }],
              outputs: [{ name: 'STRING', type: 'STRING', links: null, shape: 6, slot_index: 0 }],
              properties: { 'Node name for S&R': 'WD14Tagger|pysssss' },
              widgets_values: ['wd-v1-4-moat-tagger-v2', 0.15, 0.85, false, false, '', ''],
            },
            {
              id: 2,
              type: 'LoadImage',
              pos: [-1291, 685],
              size: { '0': 315, '1': 314 },
              flags: {},
              order: 0,
              mode: 0,
              outputs: [
                { name: 'IMAGE', type: 'IMAGE', links: [1], shape: 3 },
                { name: 'MASK', type: 'MASK', links: null, shape: 3 },
              ],
              properties: { 'Node name for S&R': 'LoadImage' },
              widgets_values: [load_img, 'image'],
            },
          ],
          links: [[1, 2, 0, 1, 0, 'IMAGE']],
          groups: [],
          config: {},
          extra: {},
          version: 0.4,
        },
      },
    },
  };
};
