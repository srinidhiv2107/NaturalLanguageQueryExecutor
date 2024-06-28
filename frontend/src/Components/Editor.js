import React, { useState, useEffect, useRef } from "react";
import { useSidebarContext } from "../Context/SidebarContextProvider";
import { useDB, useUpdateDB } from "../Context/DatabaseContextProvider";
import { useResponsesContext } from "../Context/ResponsesContextProvider";
import { useHistoryContext } from "../Context/HistoryContextProvider";
import { useResultContext } from "../Context/ResultContextProvider";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import { showToast } from "./Toast";
import MonacoEditor from "@monaco-editor/react";
import "../Styles/Editor.css";

const MyEditor = () => {
  const [selectedMode, setSelectedMode] = useState("SQL");
  const [NLQQuery, setNLQQuery] = useState("");
  const [SQLQuery, setSQLQuery] = useState("-- Write your SQL query here");
  const [isExecuting, setIsExecuting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { setIsCollapsed, setSelectedOption } = useSidebarContext();
  const DB = useDB();
  const updateDB = useUpdateDB();
  const { updateResponsesForWait, finalUpdateWithInfo } = useResponsesContext();
  const { history, updateHistory } = useHistoryContext();
  const { updateResultsSuccess, updateResultsError } = useResultContext();
  const optionsBtnRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (optionsBtnRef.current && !optionsBtnRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("click", handleOutsideClick);

    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  useEffect(() => {
    console.log("History: ", history);
  }, [history]);

  const handleModeClick = (mode) => setSelectedMode(mode);
  const handleNLQEditorChange = (e) => setNLQQuery(e.target.value);
  const handleSQLEditorChange = (value) => setSQLQuery(value);
  const handleOptionsClick = () => setShowOptions(!showOptions);

  const executeQuery = async (myQuery = "") => {
    if(!DB) {
      showToast("No database selected", "warning");
      return;
    }

    if(myQuery.length === 0) setIsExecuting(true);
    try {
      const response = await axios.post("http://localhost:3001/execute-sql", {
        dbName: DB,
        query: myQuery || SQLQuery
      });
      if(response?.data?.error) {
        updateResultsError(response.data.errorMessage);
        showToast("Error executing query", "error");
      }
      else {
        if(response.data.results.length > 0) {
          if(!Array.isArray(response.data.results[0])) updateResultsSuccess("", response.data.results);
          else response.data.results.forEach(tableData => updateResultsSuccess("", tableData));
        }
        if(response.data.newDB !== DB) updateDB(response.data.newDB);
        if(myQuery.length === 0) showToast("Query executed successfully!", "check_circle");
      }
    }
    catch(error) {
      console.error("Error executing query:", error);
      if(myQuery.length === 0) showToast("Error executing query", "error");
    }
    finally {
      if(myQuery.length === 0) setIsExecuting(false);
    }
  };

  const generateSQLQuery = async () => {
    if(!DB) {
      showToast("No database selected", "warning");
      return;
    }

    if(!NLQQuery) {
      showToast("Please provide NLQ", "warning");
      return;
    }
    setIsGenerating(true);
    try {
      const response = await axios.post("http://localhost:3001/generate-sql", {
        dbName: DB,
        nlq: NLQQuery
      });
      setSQLQuery(response.data.message.sqlQuery);
      updateHistory(NLQQuery, response.data.message.sqlQuery);
      showToast("Query generated successfully!", "check_circle");
    }
    catch(error) {
      console.error("Error generating query:", error);
      showToast("Error generating query", "error");
    }
    finally {
      setIsGenerating(false);
    }
  };

  const explainSQLQuery = async () => {
    if(!DB) {
      showToast("No database selected", "warning");
      return;
    }

    setIsCollapsed(false);
    setSelectedOption("Interactions");
    updateResponsesForWait("explain");
    try {
      const response = await axios.post("http://localhost:3001/explain-sql", {
        dbName: DB,
        query: SQLQuery
      });
      finalUpdateWithInfo(response.data.message.explanation);
      showToast("Explanation generated successfully!", "check_circle");
    }
    catch(error) {
      console.error("Error explaining query:", error);
      showToast("Error explaining query", "error");
    }
  };

  const analyzeSQLQuery = async () => {
    if(!DB) {
      showToast("No database selected", "warning");
      return;
    }

    setIsCollapsed(false);
    setSelectedOption("Interactions");
    updateResponsesForWait("analyze");
    try {
      const response = await axios.post("http://localhost:3001/analyze-sql", {
        dbName: DB,
        query: SQLQuery
      });
      finalUpdateWithInfo(response.data.message.explanation);
      await executeQuery(`EXPLAIN ${SQLQuery}`);
      showToast("Query analyzed successfully!", "check_circle");
    }
    catch(error) {
      console.error("Error analyzing query:", error);
      showToast("Error analyzing query", "error");
    }
  };

  const enhanceSQLQuery = async () => {
    if(!DB) {
      showToast("No database selected", "warning");
      return;
    }

    setIsCollapsed(false);
    setSelectedOption("Interactions");
    updateResponsesForWait("enhance");
    try {
      const response = await axios.post("http://localhost:3001/enhance-sql", {
        dbName: DB,
        query: SQLQuery
      });
      setSQLQuery(response.data.message.enhancedSQL);
      finalUpdateWithInfo(response.data.message.explanation);
      showToast("Query enhanced successfully!", "check_circle");
    }
    catch (error) {
      console.error("Error enhancing query:", error);
      showToast("Error enhancing query", "error");
    }
  };

  return (
    <div className="editor">
      <Toaster />
      <div className="editor-header">
        <p>Editor</p>
        <div className="toggle-buttons">
          <button
            className={`toggle-button ${selectedMode === "NLQ" ? "active" : ""}`}
            onClick={() => handleModeClick("NLQ")}
          >
            NLQ
          </button>
          <button
            className={`toggle-button ${selectedMode === "SQL" ? "active" : ""}`}
            onClick={() => handleModeClick("SQL")}
          >
            SQL
          </button>
        </div>
      </div>
      <div className="editor-body">
        {selectedMode === "NLQ" &&
          <div className="nlq-editor-container">
            <textarea
              placeholder="Enter your natural language query here"
              value={NLQQuery}
              onChange={handleNLQEditorChange}
            />
            <button
              className="generate-button"
              onClick={generateSQLQuery}
              disabled={isGenerating}
            >
              {isGenerating ? "Generating..." : "Generate SQL"}
            </button>
          </div>
        }
        <div className="sql-editor-container" style={{ height: `${(selectedMode === "NLQ") ? "70%" : "100%"}` }}>
          <MonacoEditor
            height="100%"
            defaultLanguage="sql"
            value={SQLQuery}
            onChange={handleSQLEditorChange}
            theme="vs-light"
            options={{
              fontFamily: "JetBrains Mono Medium, sans-serif",
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false
            }}
          />
          <button
            className="execute-button"
            onClick={() => executeQuery()}
            disabled={isExecuting}
          >
            {isExecuting ? "Running..." : "Run"}
          </button>
          <button className="options-button"
                  ref={optionsBtnRef}
                  onClick={handleOptionsClick}>
            <i className="material-icons">more_horiz</i>
          </button>
          {
            showOptions &&
            <div className="options">
              <div className="option" onClick={explainSQLQuery}>Explain</div>
              <div className="option" onClick={analyzeSQLQuery}>Analyze</div>
              <div className="option" onClick={enhanceSQLQuery}>Enhance</div>
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default MyEditor;
