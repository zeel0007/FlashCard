import React from 'react';

const highlightJava = (code) => {
  if (!code) return '';
  // Basic HTML escape to prevent breaking the layout
  let escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Highlight comments (do this first to prevent formatting inside comments)
  const commentRegex = /(\/\/.*)/g;
  
  // Highlight strings (double quotes)
  const stringRegex = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  
  // Highlight Java keywords
  const keywords = /\b(class|interface|enum|extends|implements|import|package|public|private|protected|static|final|void|int|double|float|long|short|byte|char|boolean|boolean|new|return|if|else|for|while|do|switch|case|break|continue|throw|throws|try|catch|finally|this|super|null|true|false)\b/g;

  // Highlight numbers
  const numberRegex = /\b(\d+)\b/g;

  // Highlight built-in Java collections/classes
  const builtinRegex = /\b(String|System|out|println|print|Math|HashMap|Map|HashSet|Set|ArrayList|List|LinkedList|Queue|Stack|PriorityQueue|Arrays|Collections|TreeNode|ListNode|Integer|Double|Character)\b/g;

  // Render highlighted spans
  let formatted = escaped
    .replace(commentRegex, '<span class="code-comment">$1</span>')
    .replace(stringRegex, '<span class="code-str">$&</span>')
    .replace(keywords, '<span class="code-kw">$1</span>')
    .replace(numberRegex, '<span class="code-num">$1</span>')
    .replace(builtinRegex, '<span class="code-builtin">$1</span>');
  
  return formatted;
};

const CodeViewer = ({ code }) => {
  const highlighted = highlightJava(code);
  const lines = code.split('\n');

  return (
    <div className="code-wrapper">
      <div className="code-header">
        <span className="code-lang">Java</span>
        <button 
          className="code-copy-btn"
          onClick={() => {
            navigator.clipboard.writeText(code);
            alert('Java code copied to clipboard!');
          }}
          title="Copy Code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H5.25m11.9-3.042a4.875 4.875 0 0 0-6.142 0M18 7.5h.008v.008H18V7.5Zm-.008 11.25H18v.008h-.008v-.008Zm-.008-3H18v.008h-.008v-.008Zm0-3H18v.008h-.008v-.008Zm0-3H18v.008h-.008v-.008Zm-3-3H12v.008h-.008v-.008Zm-3 0H9v.008H8.992v-.008Z" />
          </svg>
          Copy
        </button>
      </div>
      <div className="code-body-wrapper">
        {/* Line Numbers Column */}
        <div className="code-line-numbers">
          {lines.map((_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        {/* Code Content Column */}
        <pre className="code-container">
          <code dangerouslySetInnerHTML={{ __html: highlighted }} />
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;
