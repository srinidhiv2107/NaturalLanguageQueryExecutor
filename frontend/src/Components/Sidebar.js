import React, { useState, useEffect } from 'react';
import { useSidebarContext } from '../Context/SidebarContextProvider';
import { useDB, useUpdateDB } from '../Context/DatabaseContextProvider';
import { useResponsesContext } from '../Context/ResponsesContextProvider';
import { useHistoryContext } from '../Context/HistoryContextProvider';
import { useResultContext } from '../Context/ResultContextProvider';
import axios from 'axios';
import { Toaster } from "react-hot-toast";
import { showToast } from "./Toast";
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";
import '../Styles/Sidebar.css';

const Sidebar = () => {
  const [databases, setDatabases] = useState([]);
  const [showDB, setShowDB] = useState([]);
  const [showHistory, setShowHistory] = useState([]);
  const {
    isCollapsed, setIsCollapsed, selectedOption, setSelectedOption
  } = useSidebarContext();
  const DB = useDB();
  const updateDB = useUpdateDB();
  const { responses, updateResponsesForWait, finalUpdateWithInfo } = useResponsesContext();
  const { history } = useHistoryContext();
  const { updateResultsSuccess } = useResultContext();

  useEffect(() => {
    setShowDB(new Array(databases.length).fill(false));
  }, [databases]);

  useEffect(() => {
    setShowHistory(new Array(history.length).fill(false));
  }, [history]);

  useEffect(() => {
    console.log(responses)
  }, [responses]);

  const handleCollapseToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsCollapsed(false);
    if(option === "Databases") {
      axios.get('http://localhost:3001/databases')
        .then(response => {
          if(response.data !== databases) setDatabases(response.data);
        })
        .catch(error => {
          console.error('Error fetching databases: ', error);
        });
    }
  };

  const handleDatabaseClick = (index) => {
    setShowDB(prevState => {
      return prevState.map((val, i) => (i === index)? !val: val);
    })
  };

  const handleTableClick = (dbName, tableName) => {
    axios.get(`http://localhost:3001/table-data?dbName=${dbName}&tableName=${tableName}`)
      .then(response => {
        updateResultsSuccess(tableName, response.data);
      })
      .catch(error => {
        console.error('Error fetching table data: ', error);
      });
  };

  const handleHistoryClick = (index) => {
    setShowHistory(prevState => {
      return prevState.map((val, i) => (i === index)? !val: val);
    });
  }

  const handleNormalizationCheck = async (dbName) => {
    setSelectedOption("Interactions");
    updateResponsesForWait("db-analysis");
    try {
      const response = await axios.post("http://localhost:3001/check-normalization", {
        dbName
      });
      finalUpdateWithInfo(response.data.message.normalizationAnalysis);
      showToast("Database analysis successful!", "check_circle");
    }
    catch(error) {
      console.error('Error checking normalization: ', error);
      showToast("Error checking normalization", "error");
    }
  };

  return (
    <div
      className={`sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`}
      style={{width: `${(!isCollapsed)? (selectedOption === "Databases"? "25%": "30%"): "3.5%"}`}}
    >
      <Toaster />
      {isCollapsed ? (
        <>
          <div className="sidebar-option" onClick={() => handleOptionClick('Databases')}>
            <h4>Databases</h4>
          </div>
          <div className="sidebar-option" onClick={() => handleOptionClick('Interactions')}>
            <h4>Interactions</h4>
          </div>
          <div className="sidebar-option" onClick={() => handleOptionClick('History')}>
            <h4>History</h4>
          </div>
        </>
      ) : (
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h4>{selectedOption}</h4>
            <i className="material-icons" onClick={handleCollapseToggle}>close</i>
          </div>
          {selectedOption === 'Databases' && (
            <div className="sidebar-body">
              {databases.map((db, index) => (
                <div key={index} className="database-card">
                  <div className="database-card-header" onDoubleClick={() => updateDB(db.dbName)}>
                    <div className={`title ${(db.dbName === DB)? "active": ""}`}>{db.dbName}</div>
                    <div className="icons">
                      <i className="material-symbols-rounded"
                         title={`check whether ${db.dbName} is normalised`}
                         onClick={(e) => {
                           e.stopPropagation();
                           handleNormalizationCheck(db.dbName);
                         }}>
                        database
                      </i>
                      <i className="material-icons" onClick={(e) => {
                        e.stopPropagation();
                        handleDatabaseClick(index);
                      }}>
                        {!(showDB[index]) ? "keyboard_arrow_down" : "keyboard_arrow_up"}
                      </i>
                    </div>
                  </div>
                  {db.tables.length > 0 && showDB[index] && (
                    <div className="table-list">
                      {db.tables.map((table, tableIndex) => (
                        <div key={tableIndex} className="table-item" onClick={() => handleTableClick(db.dbName, table)}>
                          {table}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {selectedOption === "Interactions" && (
            <div className="sidebar-body">
              {responses.length > 0 && responses.map((response, index) => (
                <div key={index} className="response">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{response.info}</ReactMarkdown>
                </div>
              ))
              }
            </div>
          )}
          {selectedOption === "History" && (
            <div className="sidebar-body">
              {history.length > 0 && history.map((component, index) => (
                <div key={index} className="history">
                  <div className="nlq-section">
                    <div className="nlq">{component.NLQ}</div>
                    <div className="icon" onClick={() => handleHistoryClick(index)}>
                      <i className="material-icons">
                        {(!showHistory[index])? "keyboard_arrow_down": "keyboard_arrow_up"}
                      </i>
                    </div>
                  </div>
                  {(showHistory[index] && (
                    <div className="sql-section">{component.SQL}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
