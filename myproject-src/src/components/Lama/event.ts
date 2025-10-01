import mitt from 'mitt';

export const EVENT_PROMPT = 'prompt';

export const EVENT_CUSTOM_MASK = 'custom_mask';
export interface CustomMaskEventData {
  mask: File;
}

export const EVENT_PAINT_BY_EXAMPLE = 'paint_by_example';
export const EVENT_PAINT_BY_EXTEND = 'paint_by_extend';
export const EVENT_PAINT_BY_MATERIAL = 'paint_by_material';
export const EVENT_PAINT_BY_BUILDREN = 'paint_by_building';

export const EVENT_PAINT_BY_CLEAN = 'paint_by_clean';
export const EVENT_USE_PEN = 'use_pen';
export const EVENT_USE_SEG = 'use_seg';
export const EVENT_USE_CLEAR = 'use_clear';
export const EVENT_USE_REVERSE = 'use_reverse';
export const EVENT_USE_COMPLETE = 'use_complete';
export const EVENT_USE_CLEAN_ALL = 'use_clean_all';
export const EVENT_DO_USE = 'do_use';
export const EVENT_NODE_IMG_UPLOAD = 'node_img_upload';
export const EVENT_NODE_DRAW_BEGIN = 'node_draw_begin';
export const EVENT_NODE_DRAW_CLEAN = 'node_draw_clean';
export const EVENT_NODE_IMG_COMPLETE = 'node_img_complete';
export const EVENT_NODE_IMG_CLEAR = 'node_img_clear';
export const EVENT_FILE_UPLOAD = 'file_upload';
export const EVENT_FILE_UPLOAD_COS = 'file_upload_cos';
export const EVENT_FILE_UPLOAD_COS_SUCCESS = 'file_upload_cos_success';
export const EVENT_AI_DISABLED = 'file_ai_disabled';

export const EVENT_BRUSH_CHANGE = 'brush_change';
export const EVENT_SEG_CANCEL = 'seg_cancel';
export const EVENT_SEG_OK = 'seg_ok';
export const EVENT_RUN_INPAINTING = 'run_inpainting';

export const EVENT_RESET_LINE_GROUP = 'reset_line_group';
export interface PaintByExampleEventData {
  image: File;
}

export const RERUN_LAST_MASK = 'rerun_last_mask';

export const DREAM_BUTTON_MOUSE_ENTER = 'dream_button_mouse_enter';
export const DREAM_BUTTON_MOUSE_LEAVE = 'dream_btoon_mouse_leave';

const emitter = mitt();

export default emitter;
