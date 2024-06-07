import React, { useState, useEffect } from 'react';
import { useResultContext } from "../Context/ResultContextProvider";
import '../Styles/Result.css';

const Result = () => {
  const [removedOne, setRemovedOne] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { results, removeResult } = useResultContext();

  useEffect(() => {
    if(results.length > 0 && !removedOne) setActiveTabIndex(results.length - 1);
    else setRemovedOne(false);
    // eslint-disable-next-line
  }, [results])

  const handleRemoveResult = (index) => {
    setRemovedOne(true);
    removeResult(index);
    if(index < activeTabIndex || (index === activeTabIndex && activeTabIndex === results.length - 1))
      setActiveTabIndex(prev => (prev === 0)? 0: prev - 1);
  };

  return (
    <div className="result">
      <div className="result-header">
        <div className="title">
          <p>Result</p>
        </div>
        <div className="tabs">
          {results.length !== 0 && results.map((result, index) => (
            <div key={index} className={`tab ${index === activeTabIndex ? "active" : ""}`} onClick={() => setActiveTabIndex(index)}>
              <span style={{fontSize: "15px"}}>
                {(result.tableName)? result.tableName: `Result ${index + 1}`}
              </span>
              <i className="material-icons" onClick={(e) => {
                e.stopPropagation(); handleRemoveResult(index);
              }}>close</i>
            </div>
          ))}
        </div>
      </div>
      <div className="result-body">
        {results.length !== 0 && (results[activeTabIndex].type === "success" ? (
          <div className="table-container">
            <table>
              <thead>
              <tr>
                {Object.keys(results[activeTabIndex].tableData[0] || {}).map((key, colIndex) => (
                  <th key={colIndex}>{key}</th>
                ))}
              </tr>
              </thead>
              <tbody>
              {results[activeTabIndex].tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {Object.values(row).map((value, colIndex) => (
                    <td key={colIndex}>{value}</td>
                  ))}
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        ): (
          <div className="error-message">
            <p>
              <span style={{color: "red", fontSize: "16px", fontWeight: "bold"}}>Error</span>
              <br/>{results[activeTabIndex].errorMessage}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Result;
