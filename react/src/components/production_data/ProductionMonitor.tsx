import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  Drawer,
  Grid,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  Chip,
  Paper,
  Tab,
} from '@mui/material';

import { keyframes } from '@mui/system';
import ReactECharts from 'echarts-for-react';

import { useApi } from '../../utils/GlobalApiWrapper';
import CustomSnackbar from '../../utils/CustomSnackbar';

import {
  formatDate,
  getShiftDetails,
  shiftIndex,
} from '../../utils/HelperConfig';

import type {
  msg_alert,
  FormationItem,
  CosmeticItem,
} from '../../types/globalTypes';

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

interface ProductionLineOverview {
  line_name: string;
  total_produced: number;
  total_rejected: number;
  combined_yield_percent: number;
}

interface BatchData {
  line_no: string;
  Article: string;
  batchNo: string;
  VialType: string;
  batchSDT: string;
  batchEDT: string;
  machineId: string;
  ArticleCode: string;
  Batchqty: number;
  status?: string;
}

const formatNumber = (value?: number | null) => {
  if (value === undefined || value === null) return '-';
  return Number(value).toLocaleString();
};

const ProductionMonitor = () => {
  const navigate = useNavigate();
  const WSS_URL = window.location.hostname === "localhost" ? import.meta.env.VITE_WSS_URL : import.meta.env.VITE_WSS_PROD;
  const { executeApi } = useApi();

  const [loading, setLoading] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [Alert, setAlert] = useState<msg_alert>({ open: false, text: '', type: '' });

  // FILTERS
  const [formationData, setFormationData] = useState<FormationItem[]>([]);
  const [cosmeticData, setCosmeticData] = useState<CosmeticItem[]>([]);

  const [lineOptions, setLineOptions] = useState<string[]>([]);
  const [lineData, setLineData] = useState<ProductionLineOverview[]>([]);
  const [batchData, setBatchData] = useState<BatchData[]>([]);

  const shiftOptions = ['Shift-A', 'Shift-B', 'Shift-C'];
  const [selectedShift, setSelectedShift] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [selectedArticleCode, setSelectedArticleCode] = useState<string | null>(null);
  const [selectedVialType, setSelectedVialType] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>('RUNNING');
  const [todaySelected, setTodaySelected] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // FETCH INITIAL DATA ON LOAD
  const getOverallProductionData = async () => {
    try {
      setLoading(true);

      const response = await executeApi({
        method: 'POST',
        url: '/api/productionData',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          machineId: selectedLine || null,
          batchNo: selectedBatch || null,
          article: selectedArticle || null,
          articleCode: selectedArticleCode || null,
          vialType: selectedVialType || null,
          shift: selectedShift || null,
          status: selectedStatus || null,
          startDate: dateRange.start || null,
          endDate: dateRange.end || null,
          today: todaySelected,
        },
      });

      if (response.text === 'PRODUCTION DATA FETCHED') {
        const result = response.data || {};

        setLineData(result['lineData'] || []);
        setLineOptions(result['batchInfo']?.TotalLines || []);
        setBatchData(result['batchInfo']?.BatchData || []);
        setFormationData(result.latestFormationData || []);
        setCosmeticData(result.latestCosmeticData || []);

        if (!selectedLine && result['batchInfo']?.TotalLines?.length > 0) {
          setSelectedLine(result['batchInfo'].TotalLines[0]);
        }
        setAlert({ open: true, text: response.text, type: 'success' });
      } else {
        setAlert({ open: true, text: response.text, type: 'warning' });
      }
    } catch (error: any) {
      console.error(error);
      setAlert({ open: true, text: error.message || 'FAILED TO FETCH DATA', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getOverallProductionData();
  }, []);



  // FILTERED BATCH DATA
  const filteredBatchData = useMemo(() => {
    return batchData.filter((item) => {
      const matchLine = !selectedLine || item.line_no === selectedLine;
      const matchBatch = !selectedBatch || item.batchNo === selectedBatch;
      const matchArticle = !selectedArticle || item.Article === selectedArticle;
      const matchArticleCode = !selectedArticleCode || item.ArticleCode === selectedArticleCode;
      const matchVialType = !selectedVialType || item.VialType === selectedVialType;
      const matchStatus = !selectedStatus || item.status === selectedStatus;
      return (
        matchLine &&
        matchBatch &&
        matchArticle &&
        matchArticleCode &&
        matchVialType &&
        matchStatus
      );
    });
  }, [
    batchData,
    selectedLine,
    selectedBatch,
    selectedArticle,
    selectedArticleCode,
    selectedVialType,
    selectedStatus,
  ]);

  // SELECTED BATCH DETAILS

  const selectedBatchDetails = useMemo(() => {
    if (!selectedBatch) return null;
    return (batchData.find((item) => item.batchNo === selectedBatch) || null
    );
  }, [batchData, selectedBatch]);

  // OPTIONS
  // const lineOptions = useMemo(() => {return [...new Set(filteredBatchData.map((item) => item.line_no))]}, [filteredBatchData]);
  const batchOptions = useMemo(() => { return [...new Set(filteredBatchData.map((item) => item.batchNo))] }, [filteredBatchData]);
  const articleOptions = useMemo(() => { return [...new Set(filteredBatchData.map((item) => item.Article)),] }, [filteredBatchData]);
  const articleCodeOptions = useMemo(() => { return [...new Set(filteredBatchData.map((item) => item.ArticleCode)),] }, [filteredBatchData]);
  const vialTypeOptions = useMemo(() => { return [...new Set(filteredBatchData.map((item) => item.VialType))] }, [filteredBatchData]);
  const statusOptions = useMemo(() => { return [...new Set(batchData.map((item) => item.status || ''))] }, [batchData]);

  // AUTO FILL RELATED VALUES
  useEffect(() => {
    if (!selectedBatch) return;
    const batch = batchData.find((item) => item.batchNo === selectedBatch);

    if (!batch) return;
    setSelectedArticle(batch.Article || null);
    setSelectedArticleCode(batch.ArticleCode || null);
    setSelectedVialType(batch.VialType || null);
    setSelectedLine(batch.line_no || null);
    setSelectedStatus(batch.status || null);
  }, [selectedBatch, batchData]);

  // RESET FILTERS
  const resetFilters = () => {
    setSelectedLine(null);
    setSelectedBatch(null);
    setSelectedArticle(null);
    setSelectedArticleCode(null);
    setSelectedVialType(null);
    setSelectedShift(null);
    setSelectedStatus('RUNNING');
    setTodaySelected(true);
    setDateRange({ start: '', end: '' });
  };

  // WEBSOCKET
  useEffect(() => {
    const socket = new WebSocket(WSS_URL);
    socket.onopen = () => {
      console.log('✅ OVERALL WS CONNECTED');

      socket.send(
        JSON.stringify({
          type: 'web_socket_register',
          machine_id: 'ADMIN_USER',
          queryType: 'OVERALL_PRODUCTION_DATA',
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type !== 'production_data_update') return;

      // ---------------------------------------
      // COSMETIC
      // ---------------------------------------

      if (data.section === 'COSMETIC') {
        const incoming: CosmeticItem = {
          ...data.result,

          cosmetic_id: Number(data.result.cosmetic_id ?? 0),

          machine_id: data.result.machine_id ?? '',

          batch_no:
            data.result.batch_no ??
            data.result.batchNo ??
            '',

          cDate: data.result.cDate ?? '',

          total_produced: Number(data.result.total_produced ?? 0),

          total_rejected: Number(data.result.total_rejected ?? 0),

          accepted: Number(data.result.accepted ?? 0),

          black_spot_reject: Number(data.result.black_spot_reject ?? 0),

          crack_reject: Number(data.result.crack_reject ?? 0),

          bubble_reject: Number(data.result.bubble_reject ?? 0),

          scratch_reject: Number(data.result.scratch_reject ?? 0),

          bump_reject: Number(data.result.bump_reject ?? 0),

          glass_reject: Number(data.result.glass_reject ?? 0),

          dirty_reject: Number(data.result.dirty_reject ?? 0),

          color_variation_reject: Number(
            data.result.color_variation_reject ?? 0
          ),

          deformation_reject: Number(
            data.result.deformation_reject ?? 0
          ),

          pinhole_reject: Number(data.result.pinhole_reject ?? 0),

          black_spot_percent: Number(
            data.result.black_spot_percent ?? 0
          ),

          crack_percent: Number(data.result.crack_percent ?? 0),

          bubble_percent: Number(data.result.bubble_percent ?? 0),

          scratch_percent: Number(data.result.scratch_percent ?? 0),

          bump_percent: Number(data.result.bump_percent ?? 0),

          glass_percent: Number(data.result.glass_percent ?? 0),

          yield_percent: Number(data.result.yield_percent ?? 0),

          inspection_speed: Number(
            data.result.inspection_speed ?? 0
          ),
        };

        setCosmeticData((prev) => {
          const index = prev.findIndex(
            (item) =>
              item.machine_id === incoming.machine_id &&
              item.batch_no === incoming.batch_no &&
              item.cosmetic_id === incoming.cosmetic_id
          );

          if (index !== -1) {
            const updated = [...prev];

            updated[index] = incoming;

            return updated;
          }

          return [...prev, incoming];
        });
      }

      // ---------------------------------------
      // FORMATION
      // ---------------------------------------

      if (data.section === 'FORMATION') {
        const incoming: FormationItem = {
          ...data.result,

          formation_id: Number(data.result.formation_id ?? 0),

          batchNo: data.result.batchNo ?? '',

          machine_id: data.result.machine_id ?? '',

          cDate: data.result.cDate ?? '',

          tProduce: Number(data.result.tProduce ?? 0),

          tAccept: Number(data.result.tAccept ?? 0),

          tReject: Number(data.result.tReject ?? 0),

          yield_percent: Number(data.result.cYield ?? 0),

          fcaAccept: Number(data.result.fcaAccept ?? 0),

          fcaReject: Number(data.result.fcaReject ?? 0),

          fcbAccept: Number(data.result.fcbAccept ?? 0),

          fcbReject: Number(data.result.fcbReject ?? 0),

          idReject: Number(data.result.idReject ?? 0),

          hReject: Number(data.result.hReject ?? 0),

          ALVDTReject: Number(data.result.ALVDTReject ?? 0),

          BLVDTReject: Number(data.result.BLVDTReject ?? 0),

          BCReject: Number(data.result.BCReject ?? 0),

          cMachSpeed: Number(data.result.cMachSpeed ?? 0),

          CommonRejec: Number(data.result.CommonRejec ?? 0),

          BundleWgt: Number(data.result.BundleWgt ?? 0),

          cChuckIndex: Number(data.result.cChuckIndex ?? 0),

          cTubeCount: Number(data.result.cTubeCount ?? 0),
        };

        setFormationData((prev) => {
          const index = prev.findIndex(
            (item) =>
              item.machine_id === incoming.machine_id &&
              item.batchNo === incoming.batchNo &&
              item.formation_id === incoming.formation_id
          );

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
      console.error(err);
    };

    socket.onclose = () => {
      console.log('❌ WS CLOSED');
    };

    return () => {
      socket.close();
    };
  }, [WSS_URL]);

  // LATEST SHIFT DATA
  const latestFormationShiftData = useMemo(() => {
    return Object.values(formationData.reduce((acc, item) => {
      const details = getShiftDetails(item.cDate);
      const key = `${details.productionDate}_${details.shiftName}_${item.machine_id}_${item.batchNo}`;
      const currentTime = new Date(item.cDate).getTime();
      const existingTime = acc[key] ? new Date(acc[key].cDate).getTime() : 0;
      if (!acc[key] || currentTime > existingTime) {
        acc[key] = item;
      }
      return acc;
    }, {} as Record<string, FormationItem>)
    ).sort((a, b) => {
      const aDetails = getShiftDetails(a.cDate);
      const bDetails = getShiftDetails(b.cDate);

      if (aDetails.productionDate !== bDetails.productionDate) {
        return (
          new Date(aDetails.productionDate).getTime() -
          new Date(bDetails.productionDate).getTime()
        );
      }

      return (
        shiftIndex(aDetails.shiftName) -
        shiftIndex(bDetails.shiftName)
      );
    });
  }, [formationData]);

  const latestCosmeticShiftData = useMemo(() => {
    return Object.values(
      cosmeticData.reduce((acc, item) => {
        const details = getShiftDetails(item.cDate);
        const key = `${details.productionDate}_${details.shiftName}_${item.machine_id}_${item.batch_no}`;
        const currentTime = new Date(item.cDate).getTime();
        const existingTime = acc[key] ? new Date(acc[key].cDate).getTime() : 0;
        if (!acc[key] || currentTime > existingTime) {
          acc[key] = item;
        }
        return acc;
      }, {} as Record<string, CosmeticItem>)
    ).sort((a, b) => {
      const aDetails = getShiftDetails(a.cDate);
      const bDetails = getShiftDetails(b.cDate);
      if (aDetails.productionDate !== bDetails.productionDate) {
        return (
          new Date(aDetails.productionDate).getTime() -
          new Date(bDetails.productionDate).getTime()
        );
      }
      return (
        shiftIndex(aDetails.shiftName) -
        shiftIndex(bDetails.shiftName)
      );
    });
  }, [cosmeticData]);

  // FILTERED LINE DATA

  const selectedLineFormationData = useMemo(() => {
    if (!selectedLine) return [];
    return latestFormationShiftData.filter((item) =>
      item.machine_id?.startsWith(selectedLine)
    );
  }, [latestFormationShiftData, selectedLine]);

  const selectedLineCosmeticData = useMemo(() => {
    if (!selectedLine) return [];
    return latestCosmeticShiftData.filter((item) =>
      item.machine_id?.startsWith(selectedLine)
    );
  }, [latestCosmeticShiftData, selectedLine]);

  // PIE DATA
  const formationPieData = selectedLineFormationData.map((item) => {
      const details = getShiftDetails(item.cDate);
      return [
        {
          value: item.tAccept,
          name: `${details.shiftName} Accepted`,
        },
        {
          value: item.tReject,
          name: `${details.shiftName} Reject`,
        },
      ];
    })
    .flat();

  const cosmeticPieData = selectedLineCosmeticData.map((item) => {
      const details = getShiftDetails(item.cDate);
      return [
        {
          value: item.accepted,
          name: `${details.shiftName} Accepted`,
        },
        {
          value: item.total_rejected,
          name: `${details.shiftName} Reject`,
        },
      ];
    }).flat();

  // CHARTS
  const formationPieOption = {
    title: {
      text: `FORMATION SECTION (${selectedLine || '-'})`,
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        data: formationPieData,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
      },
    ],
  };

  const cosmeticPieOption = {
    title: {
      text: `COSMETIC SECTION (${selectedLine || '-'})`,
      left: 'center',
    },
    tooltip: {
      trigger: 'item',
    },
    legend: {
      bottom: 0,
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '65%'],
        data: cosmeticPieData,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
      },
    ],
  };


  // NAVIGATION
  const sectionClick = (section: 'forming' | 'cosmetic') => {
    if (!selectedLine) return;

    const query = new URLSearchParams({
      line: selectedLine,
      today: String(todaySelected),
    }).toString();

    if (section === 'forming') {
      navigate(`/dashboard/formation?${query}`);
    } else {
      navigate(`/dashboard/production/cosmetic?${query}`);
    }
  };

  // LINE OVERVIEW DATA
  const updateProductionOverview = useMemo(() => {
    const groupedData: Record<string, { total_produced: number; total_rejected: number }> = {};

    formationData.forEach((item) => {
      const lineName = item.machine_id?.split('-')[0] || item.machine_id || 'UNKNOWN';

      if (!groupedData[lineName]) {
        groupedData[lineName] = {
          total_produced: 0,
          total_rejected: 0,
        };
      }
      groupedData[lineName].total_produced += Number(item.tProduce || 0);
      groupedData[lineName].total_rejected += Number(item.tReject || 0);
    });

    return Object.entries(groupedData).map(([line_name, values]) => {
      const produced = values.total_produced;
      const rejected = values.total_rejected;
      const accepted = produced - rejected;

      const combined_yield_percent = produced > 0 ? (accepted / produced) * 100 : 0;
      return {
        line_name,
        total_produced: produced,
        total_rejected: rejected,
        combined_yield_percent,
      };
    }
    );

  }, [formationData]);

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%', overflowY: 'auto', flexDirection: 'column' }}>
      <CustomSnackbar
        open={Alert.open}
        message={Alert.text}
        severity={Alert.type}
        duration={Alert.duration}
        onClose={() =>
          setAlert({
            ...Alert,
            open: false,
          })
        }
      />

      {/* LOADER */}
      {loading ? (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(240,240,240,0.9)',
          }}
        >
          <Box textAlign="center">
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

            <Typography mt={2}>
              Loading Production Data...
            </Typography>
          </Box>
        </Box>
      ) : (<>

        {/* PIE CHARTS */}
        {formationPieData.length > 0 || cosmeticPieData.length > 0 ? (
          <Grid container spacing={1}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{ cursor: 'pointer' }}
                onClick={() => sectionClick('forming')}
              >
                <CardContent>
                  <ReactECharts
                    option={formationPieOption}
                    style={{
                      width: '100%',
                      minHeight: 400,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Card
                sx={{ cursor: 'pointer' }}
                onClick={() => sectionClick('cosmetic')}
              >
                <CardContent>
                  <ReactECharts
                    option={cosmeticPieOption}
                    style={{
                      width: '100%',
                      minHeight: 400,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        ) : (
          <Paper sx={{ p: 2 }}>
            <Typography>Select a line to load shift-level forming and cosmetic data.</Typography>
          </Paper>
        )}

        {/* LINE OVERVIEW */}
        <Box sx={{ width: '100%' }}>
          <Grid container spacing={1}>
            <Grid size={{ xs: 12 }}>
              <Card>
                <CardHeader
                  title="Production Line Overview"
                  sx={{
                    py: 1,
                    px: 2,
                  }}
                  slotProps={{
                    title: {
                      sx: {
                        fontSize: '14px',
                        fontWeight: 600,
                      },
                    },
                  }}
                />
                <Divider />
                <CardContent>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Line</TableCell>
                          <TableCell align="right"> Produced </TableCell>
                          <TableCell align="right"> Rejected </TableCell>
                          <TableCell align="right"> Yield %</TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {updateProductionOverview.map((item) => (
                          <TableRow
                            key={item.line_name}
                            hover
                            selected={selectedLine === item.line_name}
                            sx={{ cursor: 'pointer' }}
                            onClick={() =>
                              setSelectedLine(item.line_name)
                            }
                          >
                            <TableCell>
                              <Chip
                                label={item.line_name}
                                color={selectedLine === item.line_name ? 'primary' : 'default'}
                              />
                            </TableCell>
                            <TableCell align="right">{formatNumber(item.total_produced)}</TableCell>
                            <TableCell align="right">{formatNumber(item.total_rejected)}</TableCell>
                            <TableCell align="right">{Number(item.combined_yield_percent ?? 0).toFixed(2)}% </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* RUNNING BATCHES */}
        <Box>
          <Card>
            <CardHeader
              title="Running Batch Information"
              sx={{
                py: 1,
                px: 2,
              }}
              slotProps={{
                title: {
                  sx: {
                    fontSize: '14px',
                    fontWeight: 600,
                  },
                },
              }}
            />
            <Divider />
            <CardContent>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Line</TableCell>
                      <TableCell>Batch</TableCell>
                      <TableCell>Batch Quantity</TableCell>
                      <TableCell>Article</TableCell>
                      <TableCell>Article Code</TableCell>
                      <TableCell>Vial Type</TableCell>
                      <TableCell>Batch Start Date</TableCell>
                      <TableCell>Batch End Date</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batchData.map((batch) => (
                      <TableRow key={batch.batchNo}>
                        <TableCell> {batch.line_no}</TableCell>
                        <TableCell>{batch.batchNo}</TableCell>
                        <TableCell>{formatNumber(batch.Batchqty)}</TableCell>
                        <TableCell>{batch.VialType}</TableCell>
                        <TableCell>{batch.Article}</TableCell>
                        <TableCell>{batch.ArticleCode}</TableCell>
                        <TableCell>{formatDate(batch.batchSDT)}</TableCell>
                        <TableCell>{formatDate(batch.batchEDT) ?? '-'}</TableCell>
                        <TableCell>{batch.status === 'RUNNING' ? (
                          <Chip label="RUNNING" color="success" />
                        ) : (<Chip label={batch.status || 'N/A'} color="warning" />)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* FILTER BUTTON */}
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            right: 0,
            transform: 'translateY(-50%)',
            zIndex: 1200,
          }}
        >
          <Button
            variant="contained"
            size="small"
            sx={{
              borderRadius: '20px 0 0 20px',
            }}
            onClick={() => setFilterOpen(true)}
          >
            Filters
          </Button>
        </Box>

        {/* FILTER DRAWER */}
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
            <Grid container spacing={2}>

              {/* LINE */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={lineOptions}
                  value={selectedLine}
                  onChange={(e, value) =>
                    setSelectedLine(value)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Production Line"
                    />
                  )}
                />
              </Grid>

              {/* BATCH */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={batchOptions}
                  value={selectedBatch}
                  onChange={(e, value) =>
                    setSelectedBatch(value)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Batch Number"
                    />
                  )}
                />
              </Grid>

              {/* ARTICLE */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={articleOptions}
                  value={selectedArticle}
                  onChange={(e, value) =>
                    setSelectedArticle(value)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Article"
                    />
                  )}
                />
              </Grid>

              {/* ARTICLE CODE */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={articleCodeOptions}
                  value={selectedArticleCode}
                  onChange={(e, value) =>
                    setSelectedArticleCode(value)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Article Code"
                    />
                  )}
                />
              </Grid>

              {/* VIAL TYPE */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={vialTypeOptions}
                  value={selectedVialType}
                  onChange={(e, value) =>
                    setSelectedVialType(value)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Vial Type"
                    />
                  )}
                />
              </Grid>

              {/* SHIFT */}
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  options={shiftOptions}
                  value={selectedShift}
                  onChange={(e, value) =>
                    setSelectedShift(value)
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Shift"
                    />
                  )}
                />
              </Grid>

              {/* START DATE */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Start Date"
                  type="date"
                  fullWidth
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      start: e.target.value,
                    })
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>

              {/* END DATE */}

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="End Date"
                  type="date"
                  fullWidth
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange({
                      ...dateRange,
                      end: e.target.value,
                    })
                  }
                  slotProps={{
                    inputLabel: {
                      shrink: true,
                    },
                  }}
                />
              </Grid>

              {/* PRODUCTION START DATE */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Production Start Date"
                  fullWidth
                  value={
                    selectedBatchDetails?.batchSDT
                      ? formatDate(selectedBatchDetails.batchSDT)
                      : ''
                  }
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>

              {/* STATUS */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Status"
                  fullWidth
                  value={selectedStatus || ''}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                />
              </Grid>

              {/* TODAY */}
              <Grid
                size={{ xs: 12 }}
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <label>
                  <Checkbox
                    checked={todaySelected}
                    onChange={(e, checked) =>
                      setTodaySelected(checked)
                    }
                  />
                  Today
                </label>
              </Grid>

              {/* FETCH */}
              <Grid size={{ xs: 12 }}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => {
                    getOverallProductionData();
                    setFilterOpen(false);
                  }}> Fetch Data </Button>
              </Grid>
            </Grid>
          </Box>
        </Drawer>
      </>)}
    </Box>
  );
};

export default ProductionMonitor;