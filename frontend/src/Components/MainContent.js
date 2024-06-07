import React, { useRef, useState } from 'react';
import Editor from './Editor';
import Result from './Result';
import '../Styles/MainContent.css';

const MainContent = () => {
  const [editorHeight, setEditorHeight] = useState(50);
  const editorRef = useRef(null);
  const resultRef = useRef(null);
  const dividerRef = useRef(null);

  const MIN_EDITOR_HEIGHT = 37;
  const MIN_RESULT_HEIGHT = 9;

  const handleMouseDown = (e) => {
    e.preventDefault();
    dividerRef.current.classList.add('divider-visible');
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    const containerHeight = editorRef.current.parentElement.clientHeight;
    let newEditorHeight = (e.clientY / containerHeight) * 100;

    if (newEditorHeight < MIN_EDITOR_HEIGHT) newEditorHeight = MIN_EDITOR_HEIGHT;
    else if (newEditorHeight > 100 - MIN_RESULT_HEIGHT) newEditorHeight = 100 - MIN_RESULT_HEIGHT;

    setEditorHeight(newEditorHeight);
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    dividerRef.current.classList.remove('divider-visible');
  };

  return (
    <div className="main-content">
      <div ref={editorRef} style={{ height: `${editorHeight}%`, minHeight: `${MIN_EDITOR_HEIGHT}%` }}>
        <Editor />
      </div>
      <div
        ref={dividerRef}
        className="divider"
        onMouseDown={handleMouseDown}
      />
      <div ref={resultRef} style={{ height: `${100 - editorHeight}%`, minHeight: `${MIN_RESULT_HEIGHT}%` }}>
        <Result />
      </div>
    </div>
  );
};

export default MainContent;
