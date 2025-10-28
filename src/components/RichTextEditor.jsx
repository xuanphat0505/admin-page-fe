import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FiBold, FiItalic, FiLink, FiX } from 'react-icons/fi';

const stripHtml = (input = '') => input.replace(/<(?:.|\n)*?>/gm, ' ').replace(/\s+/g, ' ').trim();

const valueToHtml = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const first = value[0];
    if (!first) return '';
    if (typeof first === 'string') return first;
    if (typeof first?.html === 'string') return first.html;
    if (typeof first?.text === 'string') return first.text;
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item?.html === 'string') return item.html;
        if (typeof item?.text === 'string') return item.text;
        return '';
      })
      .join('');
  }
  if (typeof value === 'object') {
    if (typeof value.html === 'string') return value.html;
    if (typeof value.text === 'string') return value.text;
  }
  return '';
};

const queryCommandStateSafe = (command) => {
  try {
    return document.queryCommandState(command);
  } catch {
    return false;
  }
};

const isNodeInsideLink = (node) => {
  if (!node) return false;
  if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'A') return true;
  return Boolean(node.parentElement?.closest('a'));
};

function RichTextEditor({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  variant = 'default',
  showFormatHelp = true,
}) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    link: false,
  });

  const htmlValue = useMemo(() => valueToHtml(value), [value]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== htmlValue) {
      editorRef.current.innerHTML = htmlValue || '';
    }
  }, [htmlValue]);

  const updateActiveFormats = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) {
      setActiveFormats({ bold: false, italic: false, link: false });
      return;
    }

    const focusNode = selection.focusNode || selection.anchorNode;
    if (!focusNode || !editorRef.current.contains(focusNode)) {
      setActiveFormats({ bold: false, italic: false, link: false });
      return;
    }

    const boldState = queryCommandStateSafe('bold');
    const italicState = queryCommandStateSafe('italic');
    const insideLink = isNodeInsideLink(focusNode);
    const linkState = insideLink || queryCommandStateSafe('createLink');

    setActiveFormats({
      bold: Boolean(boldState),
      italic: Boolean(italicState),
      link: Boolean(linkState),
    });
  }, []);

  const syncContent = useCallback(() => {
    if (!editorRef.current) return;
    const clone = editorRef.current.cloneNode(true);
    const html = clone.innerHTML;
    const text = clone.innerText || editorRef.current.innerText;
    onChange([{ html, text: stripHtml(text) }]);
    updateActiveFormats();
  }, [onChange, updateActiveFormats]);

  useEffect(() => {
    const onSelectionChange = () => updateActiveFormats();
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', onSelectionChange);
    };
  }, [updateActiveFormats]);

  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const saveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    try {
      savedRangeRef.current = range.cloneRange();
    } catch (e) {
      savedRangeRef.current = range;
    }
    setSelectedText(selection.toString());
  }, []);

  const restoreSelection = useCallback(() => {
    const range = savedRangeRef.current;
    if (!range) return;
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    try {
      selection.addRange(range);
    } catch (e) {
      // older browsers may throw if range is invalid
    }
  }, []);

  const runAndSync = useCallback(
    (fn) => {
      focusEditor();
      fn();
      requestAnimationFrame(syncContent);
    },
    [focusEditor, syncContent],
  );

  const insertFormatting = useCallback(
    (formatType) => {
      runAndSync(() => {
        switch (formatType) {
          case 'bold':
            document.execCommand('bold', false);
            break;
          case 'italic':
            document.execCommand('italic', false);
            break;
          default:
            break;
        }
      });
    },
    [runAndSync],
  );

  const handleLinkInsert = useCallback(() => {
    const url = linkUrl.trim();
    if (!url) return;
    setShowLinkDialog(false);
    runAndSync(() => {
      restoreSelection();
      const normalizedUrl =
        /^https?:\/\//i.test(url) || url.startsWith('mailto:') || url.startsWith('#')
          ? url
          : `https://${url}`;
      document.execCommand('createLink', false, normalizedUrl);
    });
    setLinkUrl('');
  }, [linkUrl, restoreSelection, runAndSync]);

  const openLinkDialog = () => {
    saveSelection();
    setLinkUrl('');
    setShowLinkDialog(true);
  };

  const handleToolbarMouseDown = (event) => {
    event.preventDefault();
    saveSelection();
  };

  const handleLinkButton = useCallback(() => {
    if (activeFormats.link) {
      // unlink
      runAndSync(() => {
        document.execCommand('unlink', false);
      });
      return;
    }
    openLinkDialog();
  }, [activeFormats.link, runAndSync]);

  const editorClassNames = [
    'rich-text-editor',
    variant === 'compact' ? 'rich-text-editor--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const editorAreaClassNames = [
    'control',
    'rich-editor',
    variant === 'compact' ? 'rich-editor--compact' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={editorClassNames}>
      <div className="toolbar">
        <button
          type="button"
          className={`toolbar-btn ${activeFormats.bold ? 'is-active' : ''}`}
          title="In đậm (Ctrl+B)"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => insertFormatting('bold')}
        >
          <FiBold />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${activeFormats.italic ? 'is-active' : ''}`}
          title="In nghiêng (Ctrl+I)"
          onMouseDown={handleToolbarMouseDown}
          onClick={() => insertFormatting('italic')}
        >
          <FiItalic />
        </button>
        <button
          type="button"
          className={`toolbar-btn ${activeFormats.link ? 'is-active' : ''}`}
          title={activeFormats.link ? 'Bỏ liên kết' : 'Chèn liên kết'}
          onMouseDown={handleToolbarMouseDown}
          onClick={handleLinkButton}
        >
          <FiLink />
        </button>
      </div>

      <div
        ref={editorRef}
        className={editorAreaClassNames}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={(e) => {
          syncContent(e);
        }}
        onBlur={saveSelection} // Save selection on blur to preserve it for toolbar actions
        onMouseUp={updateActiveFormats}
        onKeyUp={updateActiveFormats}
      />

      {showFormatHelp && (
        <div className="format-help">
          <small>
            💡 Chọn văn bản rồi sử dụng nút trên thanh công cụ để in đậm, in nghiêng, thêm liên kết
            hoặc thay đổi cỡ chữ.
          </small>
        </div>
      )}

      {showLinkDialog && (
        <div className="link-dialog-overlay">
          <div className="link-dialog">
            <div className="dialog-header">
              <h4>Thêm liên kết</h4>
              <button type="button" className="close-btn" onClick={() => setShowLinkDialog(false)}>
                <FiX />
              </button>
            </div>
            <div className="dialog-body">
              <p>
                Văn bản đã chọn: <strong>"{selectedText}"</strong>
              </p>
              <label>URL liên kết:</label>
              <input
                type="url"
                className="control input"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus
              />
            </div>
            <div className="dialog-footer">
              <button type="button" className="btn outline" onClick={() => setShowLinkDialog(false)}>
                Huỷ
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={handleLinkInsert}
                disabled={!linkUrl.trim()}
              >
                Thêm liên kết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RichTextEditor;
