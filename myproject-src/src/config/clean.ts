export const clean = ({ client_id, mask_img }: any) => {
  console.log({
    client_id,
    mask_img,
  });
  return {
    client_id: client_id,
    prompt: {
      '1': {
        inputs: { device_mode: 'AUTO', image: ['2', 0], mask: ['2', 1] },
        class_type: 'LaMaInpaint',
      },
      '2': {
        inputs: {
          image: `${mask_img} [input]`,
          upload: 'image',
        },
        class_type: 'LoadImage',
      },
      '5': { inputs: { filename_prefix: 'EvaAI', images: ['1', 0] }, class_type: 'SaveImage' },
    },
    extra_data: {
      extra_pnginfo: {
        workflow: {
          last_node_id: 5,
          last_link_id: 6,
          nodes: [
            {
              id: 2,
              type: 'LoadImage',
              pos: [-1389, 749],
              size: { '0': 315, '1': 314 },
              flags: {},
              order: 0,
              mode: 0,
              outputs: [
                { name: 'IMAGE', type: 'IMAGE', links: [1], shape: 3 },
                { name: 'MASK', type: 'MASK', links: [5], shape: 3, slot_index: 1 },
              ],
              properties: { 'Node name for S&R': 'LoadImage' },
              widgets_values: [`${mask_img} [input]`, 'image'],
            },
            {
              id: 1,
              type: 'LaMaInpaint',
              pos: [-986, 759],
              size: { '0': 315, '1': 78 },
              flags: {},
              order: 1,
              mode: 0,
              inputs: [
                { name: 'image', type: 'IMAGE', link: 1, slot_index: 0 },
                { name: 'mask', type: 'MASK', link: 5 },
              ],
              outputs: [{ name: 'IMAGE', type: 'IMAGE', links: [6], shape: 3, slot_index: 0 }],
              properties: { 'Node name for S&R': 'LaMaInpaint' },
              widgets_values: ['AUTO'],
            },
            {
              id: 5,
              type: 'SaveImage',
              pos: [-595, 770],
              size: { '0': 315, '1': 270 },
              flags: {},
              order: 2,
              mode: 0,
              inputs: [{ name: 'images', type: 'IMAGE', link: 6 }],
              properties: {},
              widgets_values: ['EvaAI'],
            },
          ],
          links: [
            [1, 2, 0, 1, 0, 'IMAGE'],
            [5, 2, 1, 1, 1, 'MASK'],
            [6, 1, 0, 5, 0, 'IMAGE'],
          ],
          groups: [],
          config: {},
          extra: {},
          version: 0.4,
          widget_idx_map: {},
        },
      },
    },
  };
};
