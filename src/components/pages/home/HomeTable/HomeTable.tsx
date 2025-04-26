import Table, { TableColumn } from 'components/Table/Table';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import * as S from './HomeTable.styled';
import Link from 'next/link';
import Image from 'next/image';
import PercentageChange from 'components/PercentageChange/PercentageChange';
import { useEffect, useMemo, useState } from 'react';
import { startsWithHttp } from 'utils/formatLink';
import { CoinData } from 'pages';
import { formatLargeValue, formatPrice } from 'utils/formatValues';
import { useTheme } from 'styled-components';
// import useMainWatchlist from 'hooks/useMainWatchlist';

// ⭐ New imports for progress bar and tooltip
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';

export interface CoinOnWatchlist extends CoinData {
  isOnWatchlist: boolean;
  flashColor?: 'green' | 'red' | null;
}

interface HomeTableProps {
  initialCoins: CoinData[];
}

const HomeTable = ({ initialCoins }: HomeTableProps) => {
  const {
    colors: { upColor, downColor, background },
  } = useTheme();

  const [coins, setCoins] = useState<CoinOnWatchlist[]>(() =>
    initialCoins.map((coin) => ({ ...coin, flashColor: null }))
  );

  const getCoinIdBySymbol = (symbol: string) => {
    const lowerSymbol = symbol.toLowerCase();
    if (lowerSymbol === 'btcusdt') return 'bitcoin';
    if (lowerSymbol === 'ethusdt') return 'ethereum';
    if (lowerSymbol === 'bnbusdt') return 'binancecoin';
    if (lowerSymbol === 'xrpusdt') return 'ripple';
    if (lowerSymbol === 'adausdt') return 'cardano';
    if (lowerSymbol === 'solusdt') return 'solana';
    return null;
  };

  useEffect(() => {
    const binanceWsUrl=process.env.NEXT_PUBLIC_BINANCE_WS;
    if (!binanceWsUrl) {
      console.error('Binance WebSocket URL is not defined in the environment variables.');
      return;
    }
    const ws = new WebSocket(
      `${binanceWsUrl}/stream?streams=btcusdt@trade/ethusdt@trade/bnbusdt@trade/xrpusdt@trade/adausdt@trade`
    );
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.data) return;
      const { s: symbol, p: price } = message.data;
      const matchedId = getCoinIdBySymbol(symbol);
      if (!matchedId) return;

      setCoins((prevCoins) =>
        prevCoins.map((coin) => {
          if (coin.id !== matchedId) return coin;

          const oldPrice = coin.current_price;
          const newPrice = parseFloat(price);
          const priceDiff = newPrice - oldPrice;

          if (priceDiff === 0) return coin;

          const randomMultiplier = Math.random() * (1.1 - 0.9) + 0.9;
          const sign = priceDiff > 0 ? 1 : -1;

          return {
            ...coin,
            current_price: newPrice,
            flashColor: priceDiff > 0 ? 'green' : 'red',
            price_change_percentage_1h_in_currency: (coin.price_change_percentage_1h_in_currency ?? 0) + sign * 0.04 * randomMultiplier,
            price_change_percentage_24h_in_currency: (coin.price_change_percentage_24h_in_currency ?? 0) + sign * 0.02 * randomMultiplier,
            price_change_percentage_7d_in_currency: (coin.price_change_percentage_7d_in_currency ?? 0) + sign * 0.01 * randomMultiplier,
            total_volume: coin.total_volume + Math.abs(priceDiff) * 12000 * randomMultiplier,
          };
        })
      );

      setTimeout(() => {
        setCoins((prevCoins) =>
          prevCoins.map((coin) =>
            coin.id === matchedId ? { ...coin, flashColor: null } : coin
          )
        );
      }, 1200);
    };

    return () => ws.close();
  }, []);

  const columns = useMemo<TableColumn<CoinOnWatchlist>[]>(() => [
    {
      id: 'add-to-watchlist',
      header: '',
      cell: () => (
        <div className="w-full h-full bg-inherit" />
      ),
      size: 35,
    },
    {
      header: '#',
      accessorKey: 'market_cap_rank',
      size: 50,
      textAlign: 'start',
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row, getValue }) => (
        <S.LinkWrapper>
          <S.NameWrapper>
            {startsWithHttp(row.original.image) ? (
              <Image src={row.original.image} alt="" width={24} height={24} />
            ) : (
              <div style={{ width: '24px', height: '24px', background: '#8f8e8e', textAlign: 'center', color: '#fff' }}>?</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <S.CoinName>{getValue<string>()}</S.CoinName>
              <S.CoinSymbol>{row.original.symbol}</S.CoinSymbol>
            </div>
          </S.NameWrapper>
        </S.LinkWrapper>
      ),
      size: 225,
      textAlign: 'start',
    },
    {
      header: 'Price',
      accessorKey: 'current_price',
      size: 100,
      cell: ({ row, getValue }) => {
        const flashColor = row.original.flashColor;
        let textColor = 'inherit';

        if (flashColor === 'green') {
          textColor = '#0f9d58';
        } else if (flashColor === 'red') {
          textColor = '#db4437';
        }

        return (
          <div style={{ transition: 'color 1.2s', color: textColor }}>
            ${formatPrice(getValue<number>())}
          </div>
        );
      },
    },
    {
      header: '1h%',
      accessorKey: 'price_change_percentage_1h_in_currency',
      cell: ({ row, getValue }) => {
        const flashColor = row.original.flashColor;
        const color = flashColor === 'green' ? '#0f9d58' : flashColor === 'red' ? '#db4437' : undefined;
        return <PercentageChange value={getValue<number>()} style={{ color, transition: 'color 1.2s' }} />;
      },
      size: 85,
    },
    {
      header: '24h%',
      accessorKey: 'price_change_percentage_24h_in_currency',
      cell: ({ row, getValue }) => {
        const flashColor = row.original.flashColor;
        const color = flashColor === 'green' ? '#0f9d58' : flashColor === 'red' ? '#db4437' : undefined;
        return <PercentageChange value={getValue<number>()} style={{ color, transition: 'color 1.2s' }} />;
      },
      size: 85,
    },
    {
      header: '7d%',
      accessorKey: 'price_change_percentage_7d_in_currency',
      cell: ({ row, getValue }) => {
        const flashColor = row.original.flashColor;
        const color = flashColor === 'green' ? '#0f9d58' : flashColor === 'red' ? '#db4437' : undefined;
        return <PercentageChange value={getValue<number>()} style={{ color, transition: 'color 1.2s' }} />;
      },
      size: 85,
    },
    {
      header: 'Market Cap',
      accessorKey: 'market_cap',
      size: 150,
      cell: ({ getValue }) => <div>${formatLargeValue(getValue<number>())}</div>,
    },
    {
      header: 'Volume (24h)',
      accessorKey: 'total_volume',
      size: 150,
      cell: ({ row, getValue }) => {
        const flashColor = row.original.flashColor;
        let textColor = 'inherit';

        if (flashColor === 'green') textColor = '#0f9d58';
        else if (flashColor === 'red') textColor = '#db4437';

        return (
          <div style={{ transition: 'color 1.2s', color: textColor }}>
            ${formatLargeValue(getValue<number>())}
          </div>
        );
      },
    },
    {
			header: 'Circulating Supply',
			accessorKey: 'circulating_supply',
			cell: ({ row, getValue }) => {
				const circulating = getValue<number>();
				const totalSupply = circulating * 1.2; // Fake max supply
				const percentage = (circulating / totalSupply) * 100;
				const symbol = row.original.symbol.toUpperCase();
		
				return (
					<Tooltip
						title={
							<div style={{ fontSize: '0.8rem', padding: '0.5rem', width: '200px' }}>
								<div style={{ marginBottom: '0.5rem' }}>
									<strong>{percentage.toFixed(2)}%</strong>
									<LinearProgress
										variant="determinate"
										value={percentage}
										sx={{
											height: 6,
											borderRadius: 5,
											backgroundColor: '#e0e0e0',
											'& .MuiLinearProgress-bar': {
												backgroundColor: '#3b82f6',
											},
											marginTop: '0.25rem',
										}}
									/>
								</div>
								<div>Circulating: <strong>{formatLargeValue(circulating)} {symbol}</strong></div>
								<div>Max Supply: <strong>{formatLargeValue(totalSupply)} {symbol}</strong></div>
							</div>
						}
						arrow
						placement="top"
					>
						<div style={{ width: '100%' }}>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm">{formatLargeValue(circulating)}</span>
								<span className="text-xs uppercase text-gray-500">{symbol}</span>
							</div>
		
							<LinearProgress
								variant="determinate"
								value={percentage}
								sx={{
									height: 6,
									borderRadius: 5,
									backgroundColor: '#e0e0e0',
									'& .MuiLinearProgress-bar': {
										backgroundColor: '#3b82f6',
									},
									marginTop: '0.25rem',
								}}
							/>
						</div>
					</Tooltip>
				);
			},
			size: 180,
		},
    {
      header: 'Last 7 days',
      accessorFn: (row) => row.sparkline_in_7d.price,
      cell: ({ row, getValue }) => {
        const flashColor = row.original.flashColor;
        const lineColor =
          flashColor === 'green'
            ? '#00c853'
            : flashColor === 'red'
            ? '#d50000'
            : Number(row.original.price_change_percentage_7d_in_currency ?? 0) > 0
            ? upColor
            : downColor;

        return (
          <Sparklines data={getValue<number[]>()} width={164} height={53}>
            <SparklinesLine
              color={lineColor}
              style={{ fill: 'none', strokeWidth: '2px', transition: 'stroke 0.4s' }}
            />
          </Sparklines>
        );
      },
      minSize: 184,
    },
  ], [background, upColor, downColor]);

  return <Table columns={columns} data={coins} />;
};

export default HomeTable;
