//Global types used across the application

// Type for message alert
export interface msg_alert {
  open: boolean;
  text: string;
  type: any;
  duration?: number;
}


// export interface FormationItem {
//   shift_date: string;
//   total_produced: number;
//   total_rejected: number;
//   yield_percent: number;

//   m1_accept_count: number;
//   m1_reject_count: number;

//   m2_accept_count: number;
//   m2_reject_count: number;

//   id_reject_count: number;
//   lvdt_reject_count: number;
//   bottom_concavity_reject_count: number;

//   machine_speed:  number;
//   machine_index_count: number;
//   shift_name?: string;
//   line_name?: string;
//   tube_consumed_per_kg?: number;
//   vials_per_tube?: number;

//   common_rejection?: number;
//   accepted?: number;
// }

export interface FormationItem {
  formation_id: number;
  batchNo: string;
  machine_id: string;
  cDate: string;

  tProduce: number;
  tAccept: number;
  tReject: number;

  cYield: number;

  fcaAccept: number;
  fcaReject: number;

  fcbAccept: number;
  fcbReject: number;

  idReject: number;
  hReject: number;
  ALVDTReject: number;
  BLVDTReject: number;
  BCReject: number;
  cMachSpeed: number;
  CommonReject: number;
  BundleWgt: number;
  cChuckIndex: number;
  cTubeCount: number;
}

export interface CosmeticItem {
  cDate: string;
  cosmetic_id: number;
  machine_id: string;
  batch_no: string;
  total_produced: number;
  total_rejected: number;
  accepted: number;
  black_spot_reject: number;
  crack_reject: number;
  bubble_reject: number;
  scratch_reject: number;
  bump_reject: number;
  glass_reject: number;
  dirty_reject: number;
  color_variation_reject: number;
  deformation_reject: number;
  pinhole_reject: number;
  black_spot_percent: number;
  crack_percent: number;
  bubble_percent: number;
  scratch_percent: number;
  bump_percent: number;
  glass_percent: number;
  yield_percent: number;
  inspection_speed: number;
}

export type Pulse_Status = 'SUCCESS' | 'STOPPED' | 'WARNING' | 'ERROR' | 'ACTIVE' | 'INACTIVE';