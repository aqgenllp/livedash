import { useEffect, useState } from 'react';
import { Box, Grid, Paper, Typography, Autocomplete, Button, TextField, Drawer, Checkbox } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { useApi } from '../../utils/GlobalApiWrapper';
import CustomSnackbar from '../../utils/CustomSnackbar';
import { keyframes } from '@mui/system';
import type { CosmeticItem, msg_alert } from '../../types/globalTypes';
import { formatDate, getShiftDetails, shiftIndex } from '../../utils/HelperConfig';
import { ReaderIndicator, ScanStatusLamp } from '../../utils/Pulse';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;


const Cosmetic = () => {
  const WSS_URL = window.location.hostname === "localhost" ? import.meta.env.VITE_WSS_LOCAL : import.meta.env.VITE_WSS_PROD;
  const LOCAL_SERVICE_WS = import.meta.env.VITE_LOCAL_WS;

  const { executeApi } = useApi();
  const [Alert, setAlert] = useState<msg_alert>({ open: false, text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [cosmeticData, setCosmeticData] = useState<CosmeticItem[]>([]);
  const [shiftOptions, setShiftOptions] = useState<string[]>(['Shift-A', 'Shift-B', 'Shift-C']);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [todaySelected, setIsToday] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<string | null>('Batch001');
  const [batchOptions, setBatchOptions] = useState<string[]>(['Batch001', 'Batch002', 'Batch003', 'Batch004', 'Batch005']);
  const [machineId, setMachineId] = useState<string>('L1_COLD');


  // Alarm Logs State
  const [pulseStatus, setPulseStatus] = useState<"ACTIVE" | "STOPPED">("STOPPED");
  const [alarmLogs, setAlarmLogs] = useState<{ text: string; type: 'error' | 'warning' | 'success'; time: string; }[]>([]);

  const cosmeticDataCurrentShift = async () => {
    if (!machineId) {
      console.log("handle for unregistered machine");
    }
    setLoading(true);
    let reqOptions = {
      url: '/api/cosmeticLineData',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        today: true,
        machineId: machineId,
        batchNo: selectedBatch
      },
    };

    try {
      const response = await executeApi(reqOptions);
      if (response.text === "COSMETIC DATA FETCHED") {
        setAlert({ open: true, text: response.text, type: 'success' });
      } else {
        setAlert({ open: true, text: response.text, type: 'warning' });
      }
      setCosmeticData(response?.data ?? []);
    } catch (error: any) {
      setAlert({ open: true, text: `FAILED TO FETCHDATA : ${error.message}`, type: 'error' });
      setCosmeticData([]);
    } finally {
      setLoading(false);
    }

  }

  useEffect(() => {
    const loadData = async () => {
      const data = await getClientData();
      if (data && typeof data === 'object') {
        const tempId = `${data.line ?? ''}_${data.section ?? ''}`;
        setMachineId(tempId);
        if (data.batchNo && data.status === "RUNNING") {
          setSelectedBatch(data.batchNo);
        }
        let currentDate = new Date();
        let shiftData = await getShiftDetails(currentDate);
        setSelectedShift(shiftData.shiftName);
        await cosmeticDataCurrentShift();
      }
    };
    loadData();
  }, []);

  let getClientData = async () => {
    try {
      const response = await executeApi({ url: '/api/clientData', method: 'GET' });
      if (response.text === "MACHINE DATA FOUND") {
        setAlert({ open: true, text: response.text, type: 'success' });
        const clientData = response.data;
        // setSelectedMachineData(clientData);
        return clientData;
      } else {
        // i have to handle for defalt machines which are not registered in device info table and also for machines which are registered but not found due to some reason
        setAlert({ open: true, text: response.text, type: 'warning' });
        return null;
      }
    } catch (error: any) {
      setAlert({ open: true, text: `FAILED TO FETCH DATA : ${error.message}`, type: 'error' });
      return null;
    }
  };

  const getCosmeticDataWithFilters = async () => {
    setLoading(true);
    let StartDate = dateRange.start;
    let EndDate = dateRange.end;
    if (StartDate && EndDate && new Date(StartDate) > new Date(EndDate)) {
      setAlert({ open: true, text: 'Start date cannot be after end date', type: 'error' });
      setLoading(false);
      return;
    }

    if (!StartDate && EndDate) {
      setAlert({ open: true, text: 'Please select start date', type: 'error' });
      setLoading(false);
      return;
    }

    if (todaySelected && (StartDate || EndDate)) {
      setAlert({ open: true, text: 'Today filter cannot be selected with date range', type: 'error' });
      setLoading(false);
      return;
    }

    // if (!EndDate && !StartDate && !todaySelected && !selectedShift) {
    //   setAlert({ open: true, text: 'Please Select any Filter To Proceed', type: 'warning' });
    //   setLoading(false);
    //   return;
    // }

    // if (!EndDate && !StartDate ) {
    //   setAlert({ open: true, text: 'Please Select any Filter To Proceed', type: 'warning' });
    //   setLoading(false);
    //   return;
    // }

    let reqOptions = {
      url: '/api/cosmeticLineData',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        machineId: machineId,
        batchNo: selectedBatch,
        shift: selectedShift,
        startDate: dateRange.start,
        endDate: dateRange.end,
        today: todaySelected,
      },
    };

    try {
      const response = await executeApi(reqOptions);
      // COSMETIC DATA FETCHED
      if (response.text === "COSMETIC DATA FETCHED") {
        setAlert({ open: true, text: response.text, type: 'success' });
      } else {
        setAlert({ open: true, text: response.text, type: 'warning' });
      }
      setCosmeticData(response?.data ?? []);
    } catch (error: any) {
      setAlert({ open: true, text: `FAILED TO FETCHDATA : ${error.message}`, type: 'error' });
      setCosmeticData([]);
    } finally {
      setLoading(false);
    }
  }

  // websocket initialization and message handling
  useEffect(() => {
    const socket = new WebSocket(WSS_URL);
    socket.onopen = () => {
      console.log("✅ WebSocket Connected");
      socket.send(
        JSON.stringify({
          type: "web_socket_register",
          machine_id: machineId,
          queryType: "production_data_update"
        })
      );
    };



    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "production_data_update") {
        let incoming = data.result;
        incoming = {
          ...incoming,
          id: Number(incoming.id ?? 0),
          cosmetic_id: Number(incoming.cosmetic_id ?? 0),
          batchNo: incoming.batchNo ?? '',
          machine_id: incoming.machine_id ?? '',
          cDate: incoming.cDate ?? '',
          total_produced: Number(incoming.total_produced ?? 0),
          total_rejected: Number(incoming.total_rejected ?? 0),
          accepted: Number(incoming.accepted ?? 0),
          black_spot_reject: Number(incoming.black_spot_reject ?? 0),
          crack_reject: Number(incoming.crack_reject ?? 0),
          bubble_reject: Number(incoming.bubble_reject ?? 0),
          scratch_reject: Number(incoming.scratch_reject ?? 0),
          bump_reject: Number(incoming.bump_reject ?? 0),
          glass_reject: Number(incoming.glass_reject ?? 0),
          dirty_reject: Number(incoming.dirty_reject ?? 0),
          color_variation_reject: Number(incoming.color_variation_reject ?? 0),
          deformation_reject: Number(incoming.deformation_reject ?? 0),
          pinhole_reject: Number(incoming.pinhole_reject ?? 0),
          black_spot_percent: Number(incoming.black_spot_percent ?? 0),
          crack_percent: Number(incoming.crack_percent ?? 0),
          bubble_percent: Number(incoming.bubble_percent ?? 0),
          scratch_percent: Number(incoming.scratch_percent ?? 0),
          bump_percent: Number(incoming.bump_percent ?? 0),
          glass_percent: Number(incoming.glass_percent ?? 0),
          yield_percent: Number(incoming.yield_percent ?? 0),
          inspection_speed: Number(incoming.inspection_speed ?? 0)
        };

        // const incomingDetails = getShiftDetails(incoming.cDate);

        // const index = prev.findIndex((item) => {

        //   const itemDetails = getShiftDetails(item.cDate);

        //   return (
        //     item.machine_id === incoming.machine_id &&
        //     item.batchNo === incoming.batchNo &&
        //     itemDetails.productionDate === incomingDetails.productionDate &&
        //     itemDetails.shiftName === incomingDetails.shiftName
        //   );

        // });

        setCosmeticData((prev) => {
          const index = prev.findIndex((item) => item.cosmetic_id === incoming.cosmetic_id && item.machine_id === incoming.machine_id && item.batch_no === incoming.batch_no);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = incoming;
            return updated;
          }
          return [...prev, incoming];
        });
      }

    };

    socket.onerror = (err) => {
      console.error("❌ WebSocket Error:", err);
    };

    socket.onclose = () => {
      console.log("❌ WebSocket Disconnected");
    };

    return () => {
      socket.close();
    };

  }, [WSS_URL, machineId]);

  // Local Service WebSocket for Alarms and Status
  useEffect(() => {
    const localSocket = new WebSocket(LOCAL_SERVICE_WS);
    localSocket.onopen = () => {
      console.log("✅ Local Service WS Connected");
    };

    localSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("📩 Local WS Message:", data);
      if (data.type === "service_status") {
        setPulseStatus("ACTIVE");
        pushAlarm(`[${data.service}] ${data.text}`, data.alertType);
      }
    };

    localSocket.onerror = (err) => {
      console.error("Local WS Error", err);
    };

    localSocket.onclose = () => {
      console.log("Local WS Closed");
    };

    return () => {
      localSocket.close();
    };

  }, []);

  const pushAlarm = (text: string, type: 'error' | 'warning' | 'success') => {
    const currentTime = new Date().toLocaleTimeString();

    if (type === 'success') {
      setAlarmLogs([{ text, type, time: currentTime }]);
      return;
    }
    // WARNING / ERROR -> append
    setAlarmLogs((prev) => [
      ...prev,
      {
        text,
        type,
        time: currentTime,
      },
    ]);
  };


  // 🔹 DATA MAPPING
  const latestShiftWiseData: CosmeticItem[] = Object.values(
    cosmeticData.reduce((acc, item) => {

      const details = getShiftDetails(item.cDate);

      // UNIQUE KEY => ONE RECORD PER SHIFT
      const key = `${details.productionDate}_${details.shiftName}_${item.machine_id}_${item.batch_no}`;

      const currentTime = new Date(item.cDate).getTime();

      const existingTime = acc[key]
        ? new Date(acc[key].cDate).getTime()
        : 0;

      // KEEP ONLY LATEST RECORD
      if (!acc[key] || currentTime > existingTime) {
        acc[key] = item;
      }

      return acc;

    }, {} as Record<string, CosmeticItem>)
  ).sort((a, b) => {
    return new Date(a.cDate).getTime() - new Date(b.cDate).getTime();
  });


  // 🔹 X-AXIS LABELS

  const dates = latestShiftWiseData.map((item) => {

    const details = getShiftDetails(item.cDate);

    return `${details.productionDate}\n(${details.shiftName})`;

  });


  // 🔹 LATEST RECORD

  const latestRecord =
    latestShiftWiseData.length > 0
      ? latestShiftWiseData[latestShiftWiseData.length - 1]
      : null;

  const latestProductionDetails =
    latestRecord
      ? getShiftDetails(latestRecord.cDate)
      : null;


  // 🔹 ALL SHIFT DATA OF LATEST DAY

  const latestDayData = latestShiftWiseData.filter((item) => {

    const details = getShiftDetails(item.cDate);

    return (
      details.productionDate === latestProductionDetails?.productionDate
    );

  });


  // 🔹 PIE CHART DATA

  const pieData = latestDayData.flatMap((item) => {

    const shiftDetails = getShiftDetails(item.cDate);

    const accepted = Number(item.accepted ?? 0);

    const rejected = Number(item.total_rejected ?? 0);

    return [
      {
        value: accepted,
        name: `${shiftDetails.shiftName} - Accepted`,
      },
      {
        value: rejected,
        name: `${shiftDetails.shiftName} - Rejected`,
      },
    ];

  });


  // 🔹 PIE CHART

  const cosmeticProductionOverViewPie = {

    title: {
      text: `Production Overview (${latestProductionDetails?.productionDate ?? ''})`,
      left: 'center',
    },

    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },

    legend: {
      bottom: 0,
    },

    series: [
      {
        type: 'pie',
        radius: ['35%', '60%'],

        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },

        label: {
          formatter: '{b}: {c} ({d}%)',
        },

        data: pieData,
      },
    ],
  };


  // 🔹 REJECTION DATA

  const totalReject = latestShiftWiseData.map((item) => (

    Number(item.black_spot_reject ?? 0) +
    Number(item.crack_reject ?? 0) +
    Number(item.bubble_reject ?? 0) +
    Number(item.scratch_reject ?? 0) +
    Number(item.bump_reject ?? 0) +
    Number(item.glass_reject ?? 0) +
    Number(item.dirty_reject ?? 0) +
    Number(item.color_variation_reject ?? 0) +
    Number(item.deformation_reject ?? 0) +
    Number(item.pinhole_reject ?? 0)

  ));

  const blackSpotReject = latestShiftWiseData.map(item => Number(item.black_spot_reject ?? 0));

  const crackReject = latestShiftWiseData.map(item => Number(item.crack_reject ?? 0));

  const bubbleReject = latestShiftWiseData.map(item => Number(item.bubble_reject ?? 0));

  const scratchReject = latestShiftWiseData.map(item => Number(item.scratch_reject ?? 0));

  const bumpReject = latestShiftWiseData.map(item => Number(item.bump_reject ?? 0));

  const glassReject = latestShiftWiseData.map(item => Number(item.glass_reject ?? 0));

  const dirtyReject = latestShiftWiseData.map(item => Number(item.dirty_reject ?? 0));

  const colorVariationReject = latestShiftWiseData.map(item => Number(item.color_variation_reject ?? 0));

  const deformationReject = latestShiftWiseData.map(item => Number(item.deformation_reject ?? 0));

  const pinholeReject = latestShiftWiseData.map(item => Number(item.pinhole_reject ?? 0));


  // 🔹 REJECTION STACK CHART

  const cosmeticRejectionStack = {

    title: {
      text: 'Process-wise Rejections',
      left: 'center'
    },

    tooltip: {
      trigger: 'axis'
    },

    legend: {
      bottom: 0
    },

    xAxis: {
      type: 'category',
      data: dates
    },

    yAxis: {
      type: 'value'
    },

    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },

    series: [

      {
        name: 'Black Spot',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: blackSpotReject
      },

      {
        name: 'Crack',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: crackReject
      },

      {
        name: 'Bubble',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: bubbleReject
      },

      {
        name: 'Scratch',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: scratchReject
      },

      {
        name: 'Bump',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: bumpReject
      },

      {
        name: 'Glass',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: glassReject
      },

      {
        name: 'Dirty',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: dirtyReject
      },

      {
        name: 'Color Variation',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: colorVariationReject
      },

      {
        name: 'Deformation',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: deformationReject
      },

      {
        name: 'Pinhole',
        type: 'bar',
        stack: 'total',
        barMaxWidth: 40,
        data: pinholeReject
      },

      {
        name: 'Total Reject',
        type: 'line',
        smooth: true,
        data: totalReject
      },

    ],
  };


  // 🔹 YIELD TREND

  const yieldPercent = latestShiftWiseData.map(
    item => Number(item.yield_percent ?? 0)
  );

  const yieldOption = {

    title: {
      text: 'Yield % Trend',
      left: 'center'
    },

    tooltip: {
      trigger: 'axis'
    },

    xAxis: {
      type: 'category',
      data: dates
    },

    yAxis: {
      type: 'value',
      max: 100,
      name: '%'
    },

    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      containLabel: true
    },

    series: [
      {
        name: 'Yield %',
        type: 'line',
        smooth: true,
        data: yieldPercent,

        lineStyle: {
          width: 3
        },

        areaStyle: {
          opacity: 0.1
        },
      },
    ],
  };


  // 🔹 MACHINE PERFORMANCE
  const inspectionSpeed = latestShiftWiseData.map(item => Number(item.inspection_speed ?? 0));

  const machinePerformanceOption = {
    title: { text: 'Inspection Speed Trend', left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: dates },
    yAxis: { type: 'value', name: 'Inspection Speed' },
    grid: { left: '3%', right: '3%', bottom: '10%', containLabel: true },

    series: [
      {
        name: 'Inspection Speed',
        type: 'bar',
        barMaxWidth: 40,
        data: inspectionSpeed
      },
    ],
  };

  const chartStyle = { width: '100%', minHeight: 360 };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%', overflowY: 'auto' }}>
      <CustomSnackbar
        open={Alert.open}
        message={Alert.text}
        severity={Alert.type}
        duration={Alert.duration}
        onClose={() => setAlert({ ...Alert, open: false })}
      />

      {loading ? (<Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(240,240,240,0.9)",
          pointerEvents: "all", // block interaction
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Box
            component="img"
            src="/icons/company_logo.ico"
            alt="Loading"
            sx={{
              width: 48,
              height: 48,
              animation: `${spin} 1.2s linear infinite`,
            }}
          />
          <Typography mt={2} color='var(--app-primary)'>
            Please wait, loading data…
          </Typography>
        </Box>
      </Box>) : (<>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <ReactECharts option={cosmeticProductionOverViewPie} style={chartStyle} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <ReactECharts option={cosmeticRejectionStack} style={chartStyle} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <ReactECharts option={yieldOption} style={chartStyle} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <ReactECharts option={machinePerformanceOption} style={chartStyle} />
            </Paper>
          </Grid>
        </Grid>

        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--app-primary)',
            borderRadius: '20px 0 0 20px',
            px: 1,
            py: 0.5,
            boxShadow: 3,
            gap: 1,
          }}
        >
          {/* Filter Button */}
          <Button
            variant="text"
            size="small"
            disableRipple
            sx={{
              color: '#fff',
              minWidth: 0,
              px: 1,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: 'transparent',
              },
            }}
            onClick={() => setFilterOpen(true)}
          >
            Filters
          </Button>
          {/* Pulse Indicator */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 20,
            }}
          >
            <ReaderIndicator status={pulseStatus} />
          </Box>
        </Box>

        {/* RIGHT — FILTER FORM */}
        <Drawer
          anchor="right"
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          ModalProps={{
            keepMounted: false,
          }}
          slotProps={{
            paper: {
              sx: {
                width: 300,
                p: 1,
                display: "flex",
                flexDirection: "column",
              },
            },
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              flexShrink: 0,
              mt: "calc(var(--max-appbar-height) - 8px)",
              p: 1
            }}
          >
            <Button size="small" onClick={() => setFilterOpen(false)} title="Close" className="icon-btn close"> ✕ </Button>
          </Box>

          {/* SCROLLABLE FORM */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  sx={{mt:1}}
                  options={batchOptions}
                  value={selectedBatch}
                  onChange={(event, newValue) => setSelectedBatch(newValue)}
                  renderInput={(params) => <TextField {...params} label="Batch Number" />}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Machine ID"
                  fullWidth
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={shiftOptions}
                  value={selectedShift}
                  onChange={(event, newValue) => setSelectedShift(newValue)}
                  renderInput={(params) => <TextField {...params} label="Select Shift" />}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <label>
                  <Checkbox
                    checked={todaySelected}
                    onChange={(e, checked) => setIsToday(checked)}
                    sx={{ marginRight: 1, width: 20, height: 20, color: 'var(--app-primary)', '&.Mui-checked': { color: 'green' } }}
                  />
                  Today
                </label>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => getCosmeticDataWithFilters()}
                >
                  Fetch Data
                </Button>
              </Grid>
            </Grid>

            {/* ALARM TEXT */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                right: 16,
                width: 320,
                maxWidth: 'calc(100% - 32px)',
                height: 140,
                overflowY: 'auto',
                backgroundColor: 'rgba(255,255,255,0.95)',
                border: '1px solid rgba(0,0,0,0.12)',
                boxShadow: 3,
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                fontSize: 13,
              }}
            >{alarmLogs.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>  No Active Alarms </Typography>
            ) : (alarmLogs.map((log, index) => (
              <Box
                key={index}
                sx={{
                  p: 1,
                  borderRadius: 1,
                  backgroundColor: log.type === 'error' ? 'rgba(255,0,0,0.08)' : log.type === 'warning' ? 'rgba(255,165,0,0.12)' : 'rgba(0,128,0,0.08)',
                  borderLeft: log.type === 'error' ? '4px solid red' : log.type === 'warning' ? '4px solid orange' : '4px solid green',
                }}
              >
                <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>[{log.time}]</Typography>
                <Typography variant="body2">{log.text}</Typography>
              </Box>
            ))
            )}
            </Box>
          </Box>
        </Drawer>
      </>)}
    </Box>
  )
}

export default Cosmetic
