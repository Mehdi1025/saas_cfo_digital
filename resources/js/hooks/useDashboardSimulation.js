import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { debounce } from '@/utils/debounce';
import {
    buildHorizonKpisFromSliders,
    buildSimulationChartData,
    calculateHealthScore,
    healthScoreTone,
} from '@/utils/financialSimulation';

const DEFAULT_SLIDERS = {
    marketingBudgetDelta: 0,
    newClientsPerMonth: 0,
    fixedChargesDelta: 0,
};

export function useDashboardSimulation({ historicalChartData, baselineKpis, hasFinancialData, viewedUserId }) {
    const [simulationMode, setSimulationMode] = useState(false);
    const [sliders, setSliders] = useState(DEFAULT_SLIDERS);
    const [simulatedInsight, setSimulatedInsight] = useState('');
    const [isSimulatingInsight, setIsSimulatingInsight] = useState(false);
    const [simulationError, setSimulationError] = useState(null);
    const requestIdRef = useRef(0);

    const normalizedHistorical = useMemo(
        () =>
            historicalChartData.map((row) => ({
                ...row,
                revenusHist: row.revenus,
                chargesHist: row.charges,
                revenusSim: null,
                chargesSim: null,
                isProjected: false,
            })),
        [historicalChartData],
    );

    const simulationChart = useMemo(() => {
        if (!simulationMode || !hasFinancialData) {
            return { chartData: normalizedHistorical, horizonKpis: null };
        }

        return buildSimulationChartData(historicalChartData, baselineKpis, sliders);
    }, [simulationMode, hasFinancialData, historicalChartData, baselineKpis, sliders, normalizedHistorical]);

    const activeChartData = simulationMode ? simulationChart.chartData : normalizedHistorical;

    const baselineHealthScore = useMemo(
        () => calculateHealthScore(baselineKpis, hasFinancialData),
        [baselineKpis, hasFinancialData],
    );

    const simulatedHorizonKpis = useMemo(() => {
        if (!simulationMode || !hasFinancialData) {
            return null;
        }

        return simulationChart.horizonKpis ?? buildHorizonKpisFromSliders(baselineKpis, sliders);
    }, [simulationMode, hasFinancialData, simulationChart.horizonKpis, baselineKpis, sliders]);

    const healthScore = simulationMode && simulatedHorizonKpis
        ? calculateHealthScore(simulatedHorizonKpis, hasFinancialData)
        : baselineHealthScore;

    const healthTone = healthScoreTone(healthScore);

    const fetchSimulationInsight = useMemo(
        () =>
            debounce(async (nextSliders) => {
                const requestId = ++requestIdRef.current;
                setIsSimulatingInsight(true);
                setSimulationError(null);

                try {
                    const response = await axios.post(route('dashboard.simulate-insights'), {
                        marketing_budget_delta: nextSliders.marketingBudgetDelta,
                        new_clients_per_month: nextSliders.newClientsPerMonth,
                        fixed_charges_delta: nextSliders.fixedChargesDelta,
                        viewed_user_id: viewedUserId ?? null,
                    });

                    if (requestId !== requestIdRef.current) {
                        return;
                    }

                    setSimulatedInsight(response.data?.insight ?? '');
                } catch (error) {
                    if (requestId !== requestIdRef.current) {
                        return;
                    }

                    setSimulationError(
                        error.response?.data?.message ??
                            'Analyse IA indisponible pour cette simulation.',
                    );
                    setSimulatedInsight('');
                } finally {
                    if (requestId === requestIdRef.current) {
                        setIsSimulatingInsight(false);
                    }
                }
            }, 1000),
        [viewedUserId],
    );

    useEffect(() => {
        if (!simulationMode || !hasFinancialData) {
            fetchSimulationInsight.cancel?.();
            setSimulatedInsight('');
            setSimulationError(null);
            setIsSimulatingInsight(false);
            return undefined;
        }

        fetchSimulationInsight(sliders);

        return () => {
            fetchSimulationInsight.cancel?.();
        };
    }, [simulationMode, sliders, hasFinancialData, fetchSimulationInsight]);

    const updateSlider = useCallback((key, value) => {
        setSliders((current) => ({
            ...current,
            [key]: value,
        }));
    }, []);

    const resetSimulation = useCallback(() => {
        setSliders(DEFAULT_SLIDERS);
    }, []);

    return {
        simulationMode,
        setSimulationMode,
        sliders,
        updateSlider,
        resetSimulation,
        activeChartData,
        simulationChart,
        healthScore,
        healthTone,
        baselineHealthScore,
        simulatedInsight,
        isSimulatingInsight,
        simulationError,
        simulatedHorizonKpis,
    };
}
