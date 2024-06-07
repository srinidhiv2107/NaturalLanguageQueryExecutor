import React from 'react';
import Header from './Components/Header';
import Content from './Components/Content';
import './App.css';

const App = () => {
  return (
    <>
      <div className="app">
        <Header/>
        <Content/>
      </div>
    </>
  );
}

export default App;
