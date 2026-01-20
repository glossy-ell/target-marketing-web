// components/modals/SlotRankingModal.tsx

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ChartOptions, Plugin } from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ChartDataLabels);

interface SlotRankingModalProps {
  slotSeq: number;
  onClose: () => void;
}

interface RankingData {
  created: string;
  ranking: string;
}

const SlotRankingModal = ({ slotSeq, onClose }: SlotRankingModalProps) => {
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await axios.get(`/api/slots/${slotSeq}/rankings`);
        const rawData: RankingData[] = res.data;

        const dailyLastRank = Object.values(
          rawData.reduce((acc, cur) => {
            const dateObj = new Date(cur.created);
            const kstDate = new Date(dateObj.getTime() + 9 * 60 * 60 * 1000); // UTC+9 적용
            const dateKey = kstDate.toISOString().slice(0, 10); // "YYYY-MM-DD"

            // const dateKey = dateObj.toISOString().slice(0,10);

            const prev = acc[dateKey];
        
            if (!prev || new Date(cur.created) > new Date(prev.created)) {
              acc[dateKey] = cur;
            }
        
            return acc;
          }, {} as Record<string, RankingData>)
        );
        
        dailyLastRank.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());

        setRankings(dailyLastRank);
      } catch (err) {
        console.error('순위 데이터 가져오기 실패', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankings();
  }, [slotSeq]);

  const chartData = {
    labels: rankings.map(r => {
      const kst = new Date(new Date(r.created).getTime() + 9 * 60 * 60 * 1000);
      return kst.toISOString().slice(0, 10);
    }),
    datasets: [
      {
        label: '순위',
        data: rankings.map(r => {
          const rank = Number(r.ranking ?? 0);
          return rank === 0 ? 201 : rank; // 0 → 201로 치환
        }),
        fill: false,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.3,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
      plugins: {
        legend: {
          display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return value === 201 ? '순위권 밖' : `순위: ${value}`;
          },
        },
      },
      datalabels: {
        display: true,
        align: 'end',
        anchor: 'end',
        offset: 1,
        color: '#3b82f6',
        font: {
          weight: 'bold',
          size: 12,
        },
         formatter: (value) => (value === 201 ? '순위권 밖' : `${value}`),
      },
    },
    scales: {
      y: {
        reverse: true,
        beginAtZero: true,
        title: {
          display: true,
          text: '순위',
        },
      },
    },
    animation: false,
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">일자별 순위</h2>

        {isLoading ? (
          <div className="text-center text-gray-500 py-12">🔄 순위 데이터를 불러오는 중입니다...</div>
        ) : rankings.length === 0 ? (
          <p className="text-center text-gray-500">순위 데이터가 없습니다.</p>
        ) : (
          <Line
            data={chartData}
            options={chartOptions}
            plugins={[ChartDataLabels]}
          />

        )}

        <div className="mt-6 text-right">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SlotRankingModal;
