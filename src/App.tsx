import React, { useState, useMemo } from 'react';
import './App.css';

interface Upgrade {
  id: number;
  name: string;
  startDayIndex: number; 
  duration: number; 
}

const App: React.FC = () => {
  // Days: 30 (Month N), 1-12 (Month N+1) = 13 total days
  const days = [30, ...Array.from({ length: 12 }, (_, i) => i + 1)];

  const [upgrades, setUpgrades] = useState<Upgrade[]>([]);
  const [boostOption, setBoostOption] = useState<number>(0); 

  const totalDays = days.length;

  const getSpeed = (dayIndex: number, plan: number): number => {
    if (plan === 0) return 1;
    
    // dayIndex mapping: 0=30th, 1=1st, 2=2nd, 3=3rd, ..., 12=12th
    if (plan === 1) {
      if (dayIndex === 0) return 1.25; // 30th (20%)
      if (dayIndex >= 1 && dayIndex <= 7) return 1 / 0.85; // 1-7 (15%)
      if (dayIndex >= 8) return 1.25; // 8-12 (20%)
    } else if (plan === 2) {
      // 30th: 20% boost (Carried over)
      if (dayIndex === 0) return 1.25;
      // 1st to 2nd: 10%
      if (dayIndex >= 1 && dayIndex <= 2) return 1 / 0.9;
      // 3rd to 8th: 15%
      if (dayIndex >= 3 && dayIndex <= 8) return 1 / 0.85;
      // 9th to 12th: 20%
      if (dayIndex >= 9) return 1.25;
    }
    return 1;
  };

  const calculateUpgradeBuilderTime = (upgrade: Upgrade, plan: number): number => {
    const startDayIndex = Math.floor(upgrade.startDayIndex);
    const clampedDayIndex = Math.min(Math.max(startDayIndex, 0), days.length - 1);
    const speedAtStart = getSpeed(clampedDayIndex, plan);
    return upgrade.duration * speedAtStart;
  };

  const applyPlan = (planId: number) => {
    let newUpgrades: Upgrade[] = [];
    if (planId === 1) {
      // 13 days, 13 upgrades
      newUpgrades = Array.from({ length: days.length }, (_, i) => ({
        id: Date.now() + i,
        name: '1.0d',
        startDayIndex: i,
        duration: 1,
      }));
    } else if (planId === 2) {
      // Three long upgrades (4 + 4.5 + 4.5)
      newUpgrades = [
        { id: Date.now(), name: '4.0d', startDayIndex: 0, duration: 4 },
        { id: Date.now() + 1, name: '4.5d', startDayIndex: 4, duration: 4.5 },
        { id: Date.now() + 2, name: '4.5d', startDayIndex: 8.5, duration: 4.5 },
      ];
    } else if (planId === 3) {
      // 8-day lead followed by 1-day upgrades
      newUpgrades = [
        { id: Date.now(), name: '8.0d', startDayIndex: 0, duration: 8 },
        ...Array.from({ length: 5 }, (_, i) => ({
          id: Date.now() + i + 1,
          name: '1.0d',
          startDayIndex: 8 + i,
          duration: 1,
        }))
      ];
    }
    setUpgrades(newUpgrades);
  };

  const removeUpgrade = (id: number) => {
    setUpgrades(upgrades.filter(u => u.id !== id));
  };

  const totalBuilderTime = useMemo(() => {
    return upgrades.reduce((sum, u) => sum + calculateUpgradeBuilderTime(u, boostOption), 0).toFixed(2);
  }, [upgrades, boostOption]);

  return (
    <div className="simulator-container">
      <header className="header">
        <h1>Builder Time Simulator</h1>
        <div className="total-display">
          Total Builder Time Completed: <strong>{totalBuilderTime} days</strong>
        </div>
      </header>

      <div className="options-container">
        <div className="plan-selector">
          <h3>1. Select Build Plan:</h3>
          <div className="plan-buttons">
            <button onClick={() => applyPlan(1)}>Plan 1: 1-Day Sprinters</button>
            <button onClick={() => applyPlan(2)}>Plan 2: 4 + 4.5 + 4.5</button>
            <button onClick={() => applyPlan(3)}>Plan 3: The 8-Day Lead</button>
          </div>
        </div>

        <div className="boost-selector">
          <h3>2. Select Builder Boost:</h3>
          <div className="boost-buttons">
            <button 
              className={boostOption === 0 ? 'active' : ''} 
              onClick={() => setBoostOption(0)}
            >No Boost</button>
            <button 
              className={boostOption === 1 ? 'active' : ''} 
              onClick={() => setBoostOption(1)}
            >Old GP</button>
            <button 
              className={boostOption === 2 ? 'active' : ''} 
              onClick={() => setBoostOption(2)}
            >New GP</button>
          </div>
        </div>
      </div>
      
      <div className="calendar-view-fixed">
        <div className="calendar-container">
          <div className="calendar-header">
            {days.map((day, index) => {
              const speed = getSpeed(index, boostOption);
              const boostPercent = Math.round((1 - (1/speed)) * 100);
              const boostClass = `boost-${boostPercent}`;
              
              return (
                <div key={index} className={`day-column ${boostClass}`}>
                  <div className="day-label">{day}</div>
                  <div className="boost-indicator">{boostPercent}%</div>
                  <div className="day-grid-line"></div>
                </div>
              );
            })}
          </div>

          <div className="upgrades-row">
            {upgrades.map((upgrade) => {
              const builderTime = calculateUpgradeBuilderTime(upgrade, boostOption).toFixed(2);
              return (
                <div
                  key={upgrade.id}
                  className="upgrade-card"
                  style={{
                    left: `${(upgrade.startDayIndex / totalDays) * 100}%`,
                    width: `${(upgrade.duration / totalDays) * 100}%`,
                  }}
                >
                  <div className="upgrade-content">
                    <span className="upgrade-name">{upgrade.name}</span>
                    <span className="upgrade-duration">{builderTime}b-days</span>
                  </div>
                  <button className="remove-btn" onClick={() => removeUpgrade(upgrade.id)}>&times;</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>Range: 30th to 12th (13 days). Boost applies for the full duration based on start day.</p>
        <div className="boost-details">
          {boostOption === 1 && <p>Old GP: 30th (20%), 1-7th (15%), 8-12th (20%)</p>}
          {boostOption === 2 && <p>New GP: 30th (20%), 1-2nd (10%), 3-8th (15%), 9-12th (20%)</p>}
        </div>
      </footer>

      <section className="faq-section">
        <h3>FAQ</h3>
        <p>
          <strong>How was the New GP boost schedule calculated?</strong><br/>
          The boost schedule assumes 440 points on the first day and 110 points every following day, with the initial 20% boost carried over from the previous season for only the first day (30th).
        </p>
        <table className="boost-table">
          <thead>
            <tr>
              <th>Points</th>
              <th>Gold Pass Reward</th>
              <th>Est. Day</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>50</td>
              <td>10% Builder Boost</td>
              <td>Day 1</td>
            </tr>
            <tr>
              <td>750</td>
              <td>15% Builder Boost</td>
              <td>Day 3</td>
            </tr>
            <tr>
              <td>1300</td>
              <td>20% Builder Boost</td>
              <td>Day 9</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default App;
