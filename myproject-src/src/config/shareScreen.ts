export const shareScreen = ({
  client_id,
  base64,
  ckpt,
  lora,
  weight,
  imgSize,
  prompt,
  contronet,
  autoSave,
  input_seed,
  denoise,
}: any) => {
  prompt = prompt.replaceAll('，', ',').replaceAll('night', '(night:1.25)');
  console.log({
    client_id,
    denoise,
    input_seed,
    prompt,
  });
  // const input_seed = Math.floor(Math.random() * 1000000000000);
  return {
    client_id: client_id,
    prompt: {
      '1': {
        inputs: {
          image_base64: base64,
          refresh_rate: 1000,
          prompt: '',
          slide: 0.5,
          seed: 0,
          sreen_share: null,
        },
        class_type: 'ScreenShare',
      },
      '4': { inputs: { ckpt_name: ckpt }, class_type: 'CheckpointLoaderSimple' },
      '5': {
        inputs: { size: imgSize, mode: false, images: ['1', 0] },
        class_type: 'ImageScaleDownToSize',
      },
      '6': { inputs: { image: ['5', 0] }, class_type: 'ImageSizeAndBatchSize' },
      '7': {
        inputs: { width: ['6', 0], height: ['6', 1], batch_size: 1 },
        class_type: 'EmptyLatentImage',
      },
      '9': {
        inputs: {
          text: `${prompt}, ((masterpiece)),((best quality:1.4)),(ultra-high resolution:1.2),(realistic:1.4),(8k:1.2),nsanely detailed,real world location`,
          clip: ['25', 1],
        },
        class_type: 'CLIPTextEncode',
      },
      '10': { inputs: { text: ['27', 0], clip: ['25', 1] }, class_type: 'CLIPTextEncode' },
      '12': {
        inputs: { vae_name: '真实感vae-ft-mse-840000-ema-pruned_v10.0.pt' },
        class_type: 'VAELoader',
      },
      '13': !autoSave
        ? { inputs: { images: ['20', 5] }, class_type: 'PreviewImage' }
        : { inputs: { filename_prefix: 'Eva_AI', images: ['20', 5] }, class_type: 'SaveImage' },
      '16': {
        inputs: { coarse: 'disable', resolution: 768, image: ['5', 0] },
        class_type: 'LineArtPreprocessor',
      },
      '20': {
        inputs: {
          seed: input_seed,
          steps: 7,
          cfg: 1,
          sampler_name: 'lcm',
          scheduler: 'normal',
          denoise: denoise,
          preview_method: 'none',
          vae_decode: 'true',
          model: ['25', 0],
          positive: ['28', 0],
          negative: ['28', 1],
          latent_image: ['7', 0],
          optional_vae: ['12', 0],
        },
        class_type: 'KSampler (Efficient)',
      },
      '24': {
        inputs: {
          switch_1: 'On',
          lora_name_1: 'lcm-lora-sdv1-5.safetensors',
          model_weight_1: 1,
          clip_weight_1: 1,
          switch_2: 'On',
          lora_name_2: 'Eva-GT.safetensors',
          model_weight_2: 0.3,
          clip_weight_2: 1,
          switch_3: lora ? 'On' : 'Off',
          lora_name_3: lora ? lora : 'None',
          model_weight_3: weight,
          clip_weight_3: 1,
        },
        class_type: 'CR LoRA Stack',
      },
      '25': {
        inputs: { model: ['4', 0], clip: ['4', 1], lora_stack: ['24', 0] },
        class_type: 'CR Apply LoRA Stack',
      },
      '27': {
        inputs: {
          embedding: 'EasyNegative.safetensors',
          emphasis: 0.85,
          append: true,
          text: 'paintings,sketches,(worst quality:2),(low quality:2),(normal quality:2),lowres,normal quality,logo,((text)),nsfw,',
        },
        class_type: 'EmbeddingPicker',
      },
      '28': {
        inputs: {
          strength: contronet,
          start_percent: 0,
          end_percent: 0.8,
          positive: ['9', 0],
          negative: ['10', 0],
          control_net: ['29', 0],
          image: ['16', 0],
        },
        class_type: 'ControlNetApplyAdvanced',
      },
      '29': {
        inputs: { control_net_name: 'control_v11p_sd15_lineart.pth' },
        class_type: 'ControlNetLoader',
      },
    },
    extra_data: {
      extra_pnginfo: {
        workflow: {
          last_node_id: 35,
          last_link_id: 60,
          nodes: [
            {
              id: 6,
            },
            {
              id: 7,
            },
            {
              id: 12,
            },
            {
              id: 25,
            },
            {
              id: 10,
            },
            {
              id: 16,
            },
            {
              id: 29,
            },
            {
              id: 28,
            },
            {
              id: 27,
            },
            {
              id: 4,
            },
            {
              id: 1,
            },
            {
              id: 5,
            },
            {
              id: 9,
            },
            {
              id: 24,
            },
            {
              id: 13,
            },
            {
              id: 20,
            },
          ],
          links: [
            [3, 5, 0, 6, 0, 'IMAGE'],
            [4, 6, 0, 7, 0, 'INT'],
            [5, 6, 1, 7, 1, 'INT'],
            [21, 5, 0, 16, 0, 'IMAGE'],
            [27, 7, 0, 20, 3, 'LATENT'],
            [28, 12, 0, 20, 4, 'VAE'],
            [35, 24, 0, 25, 2, 'LORA_STACK'],
            [36, 4, 0, 25, 0, 'MODEL'],
            [37, 25, 0, 20, 0, 'MODEL'],
            [38, 4, 1, 25, 1, 'CLIP'],
            [39, 25, 1, 9, 0, 'CLIP'],
            [40, 25, 1, 10, 0, 'CLIP'],
            [45, 27, 0, 10, 1, 'STRING'],
            [46, 9, 0, 28, 0, 'CONDITIONING'],
            [47, 10, 0, 28, 1, 'CONDITIONING'],
            [48, 16, 0, 28, 3, 'IMAGE'],
            [49, 29, 0, 28, 2, 'CONTROL_NET'],
            [52, 28, 0, 20, 1, 'CONDITIONING'],
            [53, 28, 1, 20, 2, 'CONDITIONING'],
            [59, 1, 0, 5, 0, 'IMAGE'],
            [60, 20, 5, 13, 0, 'IMAGE'],
          ],
          groups: [],
          config: {},
          extra: {},
          version: 0.4,
          widget_idx_map: { '1': { seed: 4 }, '20': { seed: 0, sampler_name: 4, scheduler: 5 } },
        },
      },
    },
  };
};
