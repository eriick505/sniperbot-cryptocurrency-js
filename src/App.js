import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

import "./App.css";

function App() {
  const [ticker, setTicker] = useState({});
  const [, setTradingView] = useState({});
  const [profit, setProfit] = useState({
    totalValue: 0,
    percent: 0,
    lastBuy: 0,
  });

  const [config, setConfig] = useState({
    buy: 0,
    sell: 0,
    side: "BUY",
    symbol: "BTCUSDT",
  });

  const [lastBuy, setLastBuy] = useState(0);
  const [sell, setSell] = useState(0);

  function processData(ticker) {
    const lastPrice = parseFloat(ticker.c);

    if (config.side === "BUY" && config.buy > 0 && lastPrice <= config.buy) {
      setLastBuy(lastPrice);

      setConfig((prevState) => ({ ...prevState, side: "SELL" }));

      setProfit((prevState) => ({
        ...prevState,
        lastBuy: lastPrice,
      }));

      return;
    }

    if (
      config.side === "SELL" &&
      config.sell > profit.lastBuy &&
      lastPrice >= config.sell
    ) {
      setSell(lastPrice);

      setConfig((prevState) => ({ ...prevState, side: "BUY" }));

      const lastProfit = lastPrice - profit.lastBuy;

      setProfit((prevState) => ({
        ...prevState,
        value: profit.value + lastProfit,
        percent: profit.percent + ((lastPrice * 100) / profit.lastBuy - 100),
        lastBuy: 0,
      }));

      return;
    }
  }

  const { lastJsonMessage } = useWebSocket(
    `wss://stream.binance.com:9443/stream?streams=${config.symbol.toLocaleLowerCase()}@ticker`,
    {
      onMessage: () => {
        if (lastJsonMessage && lastJsonMessage.data) {
          if (
            lastJsonMessage.stream ===
            `${config.symbol.toLocaleLowerCase()}@ticker`
          ) {
            setTicker(lastJsonMessage.data);
            processData(lastJsonMessage.data);
          }
        }
      },
      onError: (event) => {
        alert(event);
      },
    }
  );

  useEffect(() => {
    const tradingViewConfig = new window.TradingView.widget({
      autosize: true,
      symbol: `BINANCE:${config.symbol}`,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#f1f3f6",
      enable_publishing: false,
      allow_symbol_change: true,
      details: true,
      container_id: "tradingview_e6ef3",
    });

    setTradingView(tradingViewConfig);
  }, [config.symbol]);

  function onSymbolChange(e) {
    setConfig((prevState) => ({ ...prevState, symbol: e.target.value }));
  }

  function onValueChange(e) {
    setConfig((prevState) => ({
      ...prevState,
      [e.target.id]: parseFloat(e.target.value),
    }));
  }

  return (
    <div className="app">
      <div className="container">
        <div className="chartView">
          <h1>SniperBot</h1>
          <div className="tradingview-widget-container">
            <div id="tradingview_e6ef3"></div>
          </div>
        </div>

        <section className="contentInfo">
          <div className="buyAndSellForm">
            <h3>Sniper</h3>
            <div className="formRow">
              <label>Symbol:</label>
              <select
                id="symbol"
                defaultValue={config.symbol}
                onChange={onSymbolChange}
              >
                <option>BTCUSDT</option>
                <option>ETHUSDT</option>
              </select>
            </div>

            <div className="formRow">
              <label>Comprar em:</label>
              <input
                type="number"
                id="buy"
                defaultValue={config.buy}
                onChange={onValueChange}
              />
            </div>
            <div className="formRow">
              <label>Vender em:</label>
              <input
                type="number"
                id="sell"
                defaultValue={config.sell}
                onChange={onValueChange}
              />
            </div>
          </div>

          <div>
            <h3>Lucro</h3>
            <ul>
              <li>Valor do Lucro: {profit && profit.totalValue.toFixed(8)}</li>
              <li>Porcent. do Lucro: {profit && profit.percent.toFixed(2)}</li>
            </ul>
            <br />
            <h3>Atual</h3>
            <ul>
              <li>Comprou em: {lastBuy && lastBuy}</li>
              <li>Quer vender em: {config && config.sell}</li>
              <li>Mas vendeu em: {sell && sell}</li>
            </ul>
          </div>

          <div className="ticker">
            <h3>Ticker 24:</h3>
            <ul>
              <li>
                Open: <span>{ticker && ticker.o}</span>
              </li>
              <li>
                High: <span>{ticker && ticker.h}</span>
              </li>
              <li>
                Low: <span>{ticker && ticker.l}</span>
              </li>
              <li>
                Last: <span>{ticker && ticker.c}</span>
              </li>
              <li>
                Change %: <span>{ticker && ticker.P}</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
