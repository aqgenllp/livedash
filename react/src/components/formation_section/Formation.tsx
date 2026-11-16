import { useEffect, useState, useRef } from 'react';
import { Box, Grid, Paper, Typography, Autocomplete, Button, TextField, Drawer, Checkbox } from '@mui/material';
import ReactECharts from 'echarts-for-react';
import { useApi } from '../../utils/GlobalApiWrapper';
import CustomSnackbar from '../../utils/CustomSnackbar';
import { keyframes } from '@mui/system';
import type { FormationItem, msg_alert } from '../../types/globalTypes';
import { formatDate, getShiftDetails, shiftIndex } from '../../utils/HelperConfig';
import { ReaderIndicator, ScanStatusLamp } from '../../utils/Pulse';
import type { Pulse_Status } from '../../types/globalTypes';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Formation = () => { 
  const WSS_URL = window.location.hostname === "localhost" ? import.meta.env.VITE_WSS_URL : import.meta.env.VITE_WSS_PROD;
  const LOCAL_SERVICE_WS = import.meta.env.VITE_LOCAL_WS;

  const { executeApi } = useApi();
  const [Alert, setAlert] = useState<msg_alert>({ open: false, text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [formationData, setFormationData] = useState<FormationItem[]>([]);
  const [shiftOptions] = useState<string[]>(['Shift-A', 'Shift-B', 'Shift-C']);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [todaySelected, setIsToday] = useState(false);

  const [selectedBatch, setSelectedBatch] = useState<string | null>('Batch001');
  const [batchOptions, setBatchOptions] = useState<string[]>(['Batch001', 'Batch002', 'Batch003', 'Batch004', 'Batch005']);
  const [machineId, setMachineId] = useState<string>('L1_COLD');

  // Alarm Logs State
  const [pulseStatus, setPulseStatus] = useState<Pulse_Status>("STOPPED");
  const [alarmLogs, setAlarmLogs] = useState<{ text: string; type: 'error' | 'warning' | 'success'; time: string; }[]>([]);
  const [healthData, setHealthData] = useState({});

  const activeFaultsRef = useRef(new Set<string>());

  const formationDataCurrentShift = async (machine?: string) => {
    const currentMachineId = machine || machineId;
    if (!currentMachineId) {
      console.log("handle for unregistered machine");
      setLoading(false);
      return;
    }

    setLoading(true);
    let reqOptions = {
      url: '/api/formationInLineFilterBasedOnShift',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        today: true,
        machineId: currentMachineId,
        batchNo: selectedBatch
      }
    };
    try {
      const response = await executeApi(reqOptions);
      if (response.text === "FORMATION DATA FETCHED") {
        setAlert({ open: true, text: response.text, type: 'success' });
      } else {
        setAlert({ open: true, text: response.text, type: 'warning' });
      }
      setFormationData(response?.data ?? []);
    } catch (error: any) {
      setAlert({ open: true, text: `FAILED TO FETCH DATA : ${error.message}`, type: 'error' });
      setFormationData([]);
    } finally {
      setLoading(false);
    }
  };

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
        await formationDataCurrentShift(tempId);
      } else {
        console.log("handle for unregistered machine");
        setLoading(false);
        setFormationData([]);
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

  // websocket initialization and message handling
  useEffect(() => {
    const socket = new WebSocket(WSS_URL);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "production_data_update") {
        let incoming = data.result;
        incoming = {
          ...incoming,
          id: Number(incoming.id ?? 0),
          formation_id: Number(incoming.formation_id ?? 0),
          batchNo: incoming.batchNo ?? '',
          machine_id: incoming.machine_id ?? '',
          cDate: incoming.cDate ?? '',

          tProduce: Number(incoming.tProduce ?? 0),
          tAccept: Number(incoming.tAccept ?? 0),
          tReject: Number(incoming.tReject ?? 0),

          yield_percent: Number(incoming.cYield ?? 0),

          fcaAccept: Number(incoming.fcaAccept ?? 0),
          fcaReject: Number(incoming.fcaReject ?? 0),

          fcbAccept: Number(incoming.fcbAccept ?? 0),
          fcbReject: Number(incoming.fcbReject ?? 0),

          idReject: Number(incoming.idReject ?? 0),
          hReject: Number(incoming.hReject ?? 0),
          ALVDTReject: Number(incoming.ALVDTReject ?? 0),
          BLVDTReject: Number(incoming.BLVDTReject ?? 0),
          BCReject: Number(incoming.BCReject ?? 0),
          cMachSpeed: Number(incoming.cMachSpeed ?? 0),
          CommonReject: Number(incoming.CommonReject ?? 0),
          BundleWgt: Number(incoming.BundleWgt ?? 0),
          cChuckIndex: Number(incoming.cChuckIndex ?? 0),
          cTubeCount: Number(incoming.cTubeCount ?? 0),
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

        setFormationData((prev) => {
          const index = prev.findIndex((item) => item.formation_id === incoming.formation_id && item.machine_id === incoming.machine_id && item.batchNo === incoming.batchNo);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = incoming;
            return updated;
          }
          return [...prev, incoming];
        });
      }

      if (data.type === "PONG") {
        console.log("🏓 Pong received");
        return;
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

  // const updateHealthData = (data: any) => {
  //   setHealthData(data);

  //   let services =  Object.entries(data).filter(([key, value]) => value.status === false);

  //   services.forEach(([key, value]) => {
  //     pushAlarm(`[${key}] ${value.text}`, value.type);
  //   });
  // }


  //   const STATUS_COLORS: Record<string, string> = {
  //   SUCCESS: '#2e7d32',
  //   WARNING: '#ed6c02',
  //   ERROR: '#d32f2f',
  //   STOPPED: '#c62828',
  //   ACTIVE: '#1976d2',
  //   INACTIVE: '#757575',
  // };

  // const updateHealthData = (services: any) => {
  //   setAlarmLogs([]);
  //   setHealthData(services);

  //   const failedServices = Object.entries(services).filter(([_, service]: any) => service.status === false);

  //   if (failedServices.length === 0) {
  //     setPulseStatus("ACTIVE");
  //     pushAlarm(`✅ All services Online`, "success");
  //     return; 
  //   }


  //   setPulseStatus("ERROR");

  //   failedServices.forEach(([serviceName, service]: any) => {
  //     if (!activeFaultsRef.current.has(serviceName)) {
  //       setPulseStatus("WARNING");
  //       pushAlarm(`[${serviceName}] ${service.text}`,service.type || "error");
  //       activeFaultsRef.current.add(serviceName);
  //     }
  //   });

  //   // remove recovered services from fault set
  //   Object.entries(services).forEach(([serviceName, service]: any) => {
  //     if (service.status) {
  //       activeFaultsRef.current.delete(serviceName);
  //     }
  //   });
  // };

  const updateHealthData = (services: any) => {
    setHealthData(services);

    const failedServices = Object.entries(services).filter(([_, service]: any) => service.status === false);
    if (failedServices.length === 0) {
      activeFaultsRef.current.clear();
      setAlarmLogs([]);
      setPulseStatus("ACTIVE");
      pushAlarm("✅ All services Online", "success");
      return;
    }

    // SOME SERVICES FAILED
    setPulseStatus("WARNING");
    failedServices.forEach(([serviceName, service]: any) => {
      if (!activeFaultsRef.current.has(serviceName)) {
        pushAlarm(`[${serviceName}] ${service.text}`, "error");
        activeFaultsRef.current.add(serviceName);
      }
    });

    // Remove recovered services
    Object.entries(services).forEach(([serviceName, service]: any) => {
      if (service.status) {
        activeFaultsRef.current.delete(serviceName);
      }
    });
  };

   // Local Service WebSocket for Alarms and Status
  // useEffect(() => {
  //   const localSocket = new WebSocket(LOCAL_SERVICE_WS);
  //   localSocket.onopen = () => {
  //     console.log("✅ Local Service WS Connected");
  //   };

  //   localSocket.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     console.log("📩 Local WS Message:", data);
  //     if (data.type === "service_status") {
  //       setPulseStatus("ACTIVE");
  //       pushAlarm(`[${data.service}] ${data.text}`, data.alertType);
  //     }

  //     if (data.type === "health_manager") {
  //       console.log(data, "HEALTH MANAGER");
  //     }

  //     if (data.type === "health_snapshot") {
  //       let healthSnapshot = data.snapshot.services;
  //       if (healthSnapshot) {
  //         updateHealthData(healthSnapshot);
  //       }


  //       console.log("📦 Health snapshot:", data.snapshot.services);
  //       const clientMysql = data.snapshot.services.clientMysql;
  //       console.log(clientMysql.status, clientMysql.text, clientMysql.type);

  //     }

  //     if (data.type === "service_status") {
  //       console.log("⚡ Alert:", data.service, data.text, data.alertType);
  //     }
  //   };

  //   localSocket.onerror = (err) => {
  //     console.error("Local WS Error", err);
  //   };

  //   localSocket.onclose = () => {
  //     console.log("Local WS Closed");
  //   };

  //   return () => {
  //     localSocket.close();
  //   };

  // }, []);

  useEffect(() => {
  const localSocket = new WebSocket(LOCAL_SERVICE_WS);

  
    let pingInterval;

    localSocket.onopen = () => {
      console.log("✅ WebSocket Connected");
      localSocket.send(
        JSON.stringify({
          type: "WEBSOCKET_REGISTER",
          machine_id: machineId,
          queryType: "production_data_update"
        })
      );

      pingInterval = setInterval(() => {
        if (localSocket.readyState === WebSocket.OPEN) {
          localSocket.send(
            JSON.stringify({
              type: "PING",
              timestamp: Date.now()
            })
          )
        }

      }, 30000);
    };

  localSocket.onmessage = (event) => {
    let data: any;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Invalid Local WS message", error);
      return;
    }

    if (data.type === "service_status") {
      setPulseStatus("ACTIVE");
      pushAlarm(`[${data.service}] ${data.text}`, data.alertType);
    } else if (data.type === "health_snapshot") {
      const services = data.snapshot?.services;
      if (services) updateHealthData(services);
    }
  };

  localSocket.onerror = (error) => console.error("Local WS Error", error);
  localSocket.onclose = () => console.log("Local WS Closed");

  return () => localSocket.close();
}, []);

  //Get Data Bsed on Filters
  const getFormationDataWithFilters = async () => {
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
    //   setAlert({open: true,text: 'Please Select any Filter To Proceed',type: 'warning'});
    //   setLoading(false);
    //   return;
    // }

    let reqOptions = {
      url: '/api/formationInLineFilterBasedOnShift',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        machineId: machineId,
        batchNo: selectedBatch,
        shift: selectedShift,
        startDate: StartDate,
        endDate: EndDate,
        today: todaySelected,
      },
    };

    try {

      const response = await executeApi(reqOptions);
      if (response.text === "FORMATION DATA FETCHED") {
        setAlert({ open: true, text: response.text, type: 'success' });
      } else {
        setAlert({ open: true, text: response.text, type: 'warning' });
      }
      setFormationData(response?.data ?? []);
    } catch (error: any) {
      setAlert({ open: true, text: `FAILED TO FETCH DATA : ${error.message}`, type: 'error' });
      setFormationData([]);
    } finally {
      setLoading(false);
    }
  };

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

  // 🔹 DATA MAPPING(LATEST SHIFT-WISE DATA)
  const latestShiftWiseData: FormationItem[] = Object.values(
    formationData.reduce((acc, item) => {
      const details = getShiftDetails(item.cDate);

      // UNIQUE KEY => DATE + SHIFT + MACHINE + BATCH
      const key = `${details.productionDate}_${details.shiftName}_${item.machine_id}_${item.batchNo}`;
      const currentTime = new Date(item.cDate).getTime();
      const existingTime = acc[key] ? new Date(acc[key].cDate).getTime() : 0;

      // KEEP ONLY LATEST RECORD
      if (!acc[key] || currentTime > existingTime) {
        acc[key] = item;
      }

      return acc;

    }, {} as Record<string, FormationItem>)
  ).sort((a, b) =>
    new Date(a.cDate).getTime() - new Date(b.cDate).getTime()
  );


  // X-AXIS LABELS
  const dates = latestShiftWiseData.map((item) => {
    const details = getShiftDetails(item.cDate);
    return `${details.productionDate}\n(${details.shiftName})`;
  });


  // LATEST PRODUCTION DAY
  const latestRecord = latestShiftWiseData.length > 0 ? latestShiftWiseData[latestShiftWiseData.length - 1] : null;
  const latestProductionDetails = latestRecord ? getShiftDetails(latestRecord.cDate) : null;

  // ALL SHIFTS OF LATEST PRODUCTION DAY
  const latestDayData = latestShiftWiseData.filter((item) => {
    const details = getShiftDetails(item.cDate);
    return (
      details.productionDate === latestProductionDetails?.productionDate
    );
  });


  // PIE CHART DATA
  const pieData = latestDayData.flatMap((item) => {
    const shiftDetails = getShiftDetails(item.cDate);
    const accepted = Number(item.tAccept ?? 0);
    const rejected = Number(item.tReject ?? 0);

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


  // PIE CHART OPTION
  const productionOverViewPie = {

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


  // REJECTION CHART DATA
  const totalReject = latestShiftWiseData.map((item) =>
    (item.fcaReject ?? 0) +
    (item.fcbReject ?? 0) +
    (item.idReject ?? 0) +
    (item.ALVDTReject ?? 0) +
    (item.BLVDTReject ?? 0) +
    (item.BCReject ?? 0)
  );

  const fcaReject = latestShiftWiseData.map((item) => item.fcaReject ?? 0);
  const fcbReject = latestShiftWiseData.map((item) => item.fcbReject ?? 0);
  const idReject = latestShiftWiseData.map((item) => item.idReject ?? 0);
  const lvdtReject = latestShiftWiseData.map((item) => (item.ALVDTReject ?? 0) + (item.BLVDTReject ?? 0));
  const bottomReject = latestShiftWiseData.map((item) => item.BCReject ?? 0);
  const commonReject = latestShiftWiseData.map((item) => item.CommonReject ?? 0);

  // REJECTION CHART OPTION
  const rejectionStack = {
    title: {
      text: 'Process-wise Rejections',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    series: [
      {
        name: 'FCA Reject',
        type: 'bar',
        stack: 'total',
        data: fcaReject,
        barMaxWidth: 40,
      },

      {
        name: 'FCB Reject',
        type: 'bar',
        stack: 'total',
        data: fcbReject,
        barMaxWidth: 40,
      },

      {
        name: 'ID Reject',
        type: 'bar',
        stack: 'total',
        data: idReject,
        barMaxWidth: 40,
      },

      {
        name: 'LVDT Reject',
        type: 'bar',
        stack: 'total',
        data: lvdtReject,
        barMaxWidth: 40,
      },

      {
        name: 'Bottom Reject',
        type: 'bar',
        stack: 'total',
        data: bottomReject,
        barMaxWidth: 40,
      },

      {
        name: 'Total Reject',
        type: 'line',
        smooth: true,
        data: totalReject,
      },

      {
        name: 'Common Reject',
        type: 'line',
        smooth: true,
        data: commonReject,
      },
    ],
  };


  // YIELD TREND DATA
  const yieldPercent = latestShiftWiseData.map((item) => Number(item.cYield ?? 0));

  // YIELD CHART OPTION
  const yieldOption = {
    title: {
      text: 'Yield % Trend',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
      max: 100,
      name: '%',
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      containLabel: true,
    },
    series: [
      {
        name: 'Yield %',
        type: 'line',
        smooth: true,
        data: yieldPercent,

        lineStyle: {
          width: 3,
        },
        areaStyle: {
          opacity: 0.1,
        },
      },
    ],
  };


  // MACHINE PERFORMANCE DATA
  const machineSpeed = latestShiftWiseData.map((item) => Number(item.cMachSpeed ?? 0));
  const indexCount = latestShiftWiseData.map((item) => Number(item.cChuckIndex ?? 0));
  const tubeCount = latestShiftWiseData.map((item) => Number(item.cTubeCount ?? 0));
  const bundleWeight = latestShiftWiseData.map((item) => Number(item.BundleWgt ?? 0));

  // MACHINE PERFORMANCE OPTION
  const machineOption = {
    title: {
      text: 'Machine Performance',
      left: 'center',
    },
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      data: dates,
    },
    yAxis: {
      type: 'value',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true,
    },
    series: [
      {
        name: 'Machine Speed',
        type: 'bar',
        data: machineSpeed,
        barMaxWidth: 50,
      },

      {
        name: 'Chuck Index',
        type: 'bar',
        data: indexCount,
        barMaxWidth: 50,
      },

      {
        name: 'Tube Count',
        type: 'bar',
        data: tubeCount,
        barMaxWidth: 50,
      },

      {
        name: 'Bundle Weight',
        type: 'bar',
        data: bundleWeight,
        barMaxWidth: 50,
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
          pointerEvents: "all",
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
              <ReactECharts option={productionOverViewPie} style={chartStyle} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <ReactECharts option={rejectionStack} style={chartStyle} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <ReactECharts option={yieldOption} style={chartStyle} />
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <ReactECharts option={machineOption} style={chartStyle} />
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
              mt: "calc(var(--max-appbar-height) - 8px)", p: 1
            }}
          >
            <Button size="small" onClick={() => setFilterOpen(false)} title="Close" className="icon-btn close"> ✕ </Button>
          </Box>

          {/* SCROLLABLE FORM */}
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto'
            }}
          >
            <Grid container spacing={3}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  sx={{ mt: 1 }}
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
                  sx={{ mt: 1 }}
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
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
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
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
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
                  onClick={() => getFormationDataWithFilters()}
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
  );
};

export default Formation;