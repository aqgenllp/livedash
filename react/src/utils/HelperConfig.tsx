
export const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };


const shiftOrder = ['Shift-A', 'Shift-B', 'Shift-C'];

export const shiftIndex = (shift?: string) => {
    const idx = shiftOrder.indexOf(shift ?? '');
    return idx >= 0 ? idx : 999;
  };


export const getShiftDetails = (dateTime?: string | Date | null) => {

  const date = dateTime instanceof Date
    ? new Date(dateTime.getTime())
    : new Date(dateTime ?? '');
  if (Number.isNaN(date.getTime())) {
    return {
      shiftName: 'Shift-C',
      productionDate: '',
    };
  }

  const hours = date.getHours();
  const minutes = date.getMinutes();

  const totalMinutes = (hours * 60) + minutes;

  let shiftName = 'Shift-C';

  // SHIFT A
  if (totalMinutes >= 360 && totalMinutes < 840) {
    shiftName = 'Shift-A';
  }

  // SHIFT B
  else if (totalMinutes >= 840 && totalMinutes < 1320) {
    shiftName = 'Shift-B';
  }

  // SHIFT C
  else {
    shiftName = 'Shift-C';

    // AFTER MIDNIGHT → belongs to previous production day
    if (totalMinutes < 360) {
      date.setDate(date.getDate() - 1);
    }
  }

  const productionDate = formatDate(date.toISOString());

  return {
    shiftName,
    productionDate,
  };
};