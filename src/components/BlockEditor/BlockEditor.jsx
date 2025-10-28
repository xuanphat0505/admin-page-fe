import { useState, useEffect, useCallback } from 'react';
import {
  FiType,
  FiAlignLeft,
  FiImage,
  FiList,
  FiTrash2,
  FiPlus,
  FiUploadCloud,
  FiX,
  FiMove,
} from 'react-icons/fi';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import RichTextEditor from '../RichTextEditor';
import ListItemEditor from '../ListItemEditor';
import '../../styles/RichTextEditor.css';

import './BlockEditor.scss';

const stripHtml = (input = '') =>
  input
    .replace(/<(?:.|\n)*?>/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toPlainText = (value) => {
  const strip = (input) => stripHtml(typeof input === 'string' ? input : '');

  if (!value) return '';
  if (typeof value === 'string') return strip(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') return strip(item);
        if (item && typeof item.html === 'string') return strip(item.html);
        if (item && typeof item.text === 'string') return strip(item.text);
        return '';
      })
      .join(' ')
      .trim();
  }
  if (typeof value === 'object') {
    if (typeof value.html === 'string') return strip(value.html);
    if (typeof value.text === 'string') return strip(value.text);
  }
  return '';
};

// Component Image Block
const ImageBlock = ({
  block,
  onUpdate,
  onRemove,
  attributes,
  listeners,
  setNodeRef,
  style,
  isDragging,
}) => {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (block.content instanceof File) {
      const url = URL.createObjectURL(block.content);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (typeof block.content === 'string' && block.content) {
      setImageUrl(block.content);
      return undefined;
    }
    if (typeof block.url === 'string' && block.url) {
      setImageUrl(block.url);
      return undefined;
    }
    setImageUrl('');
    return undefined;
  }, [block.content, block.url]);

  const handleImageUpload = (file) => {
    if (file) {
      onUpdate({ content: file, url: '' });
    }
  };

  const handleImageRemove = () => {
    onUpdate({ content: null, url: '', alt: '', caption: '' });
  };

  const handleAltChange = (value) => {
    onUpdate({ alt: value });
  };

  const handleCaptionChange = (value) => {
    onUpdate({ caption: value });
  };

  const hasImage =
    block.content instanceof File ||
    (typeof block.content === 'string' && block.content) ||
    (typeof block.url === 'string' && block.url);

  const altValue = block.alt || '';
  const captionValue = block.caption || '';
  const isAltInvalid = hasImage && !altValue.trim();
  const isCaptionInvalid = hasImage && !captionValue.trim();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`block card is-sortable ${isDragging ? 'is-placeholder' : ''}`}
    >
      <div className="block-header">
        <div className="left">
          <FiImage className="block-icon" />
          <span className="title">Ảnh</span>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="pill handle"
            {...attributes}
            {...listeners}
            onClick={(e) => e.preventDefault()}
            aria-label="Kéo để sắp xếp"
          >
            <FiMove />
          </button>
          <button type="button" className="pill danger" onClick={onRemove}>
            <FiTrash2 />
          </button>
        </div>
      </div>
      <div className="block-body">
        {hasImage ? (
          <div className="image-preview">
            <img src={imageUrl} alt="Preview" className="preview-image" />
            <button type="button" className="remove-image-btn" onClick={handleImageRemove}>
              <FiX size={16} />
            </button>
          </div>
        ) : (
          <div className="image-upload-area">
            <label className="upload-label">
              <FiUploadCloud size={24} />
              <span>Choose image</span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
        <div className="image-meta">
          <label className="control-label" htmlFor={`image-alt-${block.id}`}>
            Mô tả ảnh (alt)
          </label>
          <input
            id={`image-alt-${block.id}`}
            className={`control input ${isAltInvalid ? 'invalid' : ''}`}
            type="text"
            placeholder="Nhập mô tả ngắn cho ảnh"
            value={altValue}
            onChange={(e) => handleAltChange(e.target.value)}
            disabled={!hasImage}
          />
          {isAltInvalid && <span className="field-hint">Cần nhập mô tả (alt) cho ảnh.</span>}
        </div>
        <div className="image-meta">
          <label className="control-label" htmlFor={`image-caption-${block.id}`}>
            Chú thích ảnh
          </label>
          <textarea
            id={`image-caption-${block.id}`}
            className={`control textarea ${isCaptionInvalid ? 'invalid' : ''}`}
            rows={2}
            placeholder="Thêm chú thích cho ảnh (không bắt buộc)"
            value={captionValue}
            onChange={(e) => handleCaptionChange(e.target.value)}
            disabled={!hasImage}
          />
          {isCaptionInvalid && <span className="field-hint">Cần nhập chú thích cho ảnh.</span>}
        </div>
      </div>
    </div>
  );
};

// Sortable wrapper 
const SortableBlock = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style = {
    transform: isDragging ? undefined : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };
  return children({ setNodeRef, style, attributes, listeners, isDragging });
};

function BlockEditor({ blocks, setBlocks, showBlockButtons = true }) {
  const [openDropdownIndex, setOpenDropdownIndex] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [activeBlock, setActiveBlock] = useState(null);

  const getBlockById = useCallback(
    (id) => (blocks || []).find((item) => item?.id === id) || null,
    [blocks]
  );
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const withIds = (blocks || []).map((b) =>
      b && b.id ? b : { ...b, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` }
    );
    let changed = false;
    for (let i = 0; i < withIds.length; i += 1) {
      if (blocks[i]?.id !== withIds[i]?.id) {
        changed = true;
        break;
      }
    }
    if (changed) setBlocks(withIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addBlock = (type, e) => {
    e.preventDefault();
    const initialContent =
      type === 'heading' ? { level: 'H1', text: '' } : type === 'list' ? [''] : null;
    const newBlock = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      content: initialContent,
    };
    if (type === 'image') {
      newBlock.alt = '';
      newBlock.caption = '';
    }
    setBlocks((prev) => [...(prev || []), newBlock]);
  };

  const updateBlock = (index, updates) => {
    setBlocks((prev) => {
      const draft = [...(prev || [])];
      if (!draft[index]) return draft;
      draft[index] = { ...draft[index], ...updates };
      return draft;
    });
  };

  const setBlockContent = (index, contentValue) => {
    updateBlock(index, { content: contentValue });
  };

  const removeBlock = (index) => {
    setBlocks((prev) => (prev || []).filter((_, i) => i !== index));
  };

  const handleImageUpdate = (index, updates) => {
    updateBlock(index, updates);
  };


  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveBlock(getBlockById(active.id));
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveBlock(null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) {
      handleDragCancel();
      return;
    }
    if (active.id !== over.id) {
      setBlocks((items) => {
        const list = items || [];
        const oldIndex = list.findIndex((b) => b.id === active.id);
        const newIndex = list.findIndex((b) => b.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return list;
        return arrayMove(list, oldIndex, newIndex);
      });
    }
    handleDragCancel();
  };

  const renderOverlayBlock = (block) => {
    if (!block) return null;

    if (block.type === 'heading') {
      const value =
        block.content && typeof block.content === 'object'
          ? block.content
          : { level: 'H2', text: toPlainText(block.content) };
      return (
        <div className="block card is-sortable drag-overlay">
          <div className="block-header">
            <div className="left">
              <FiType className="block-icon" />
              <span className="title">Tiêu đề</span>
            </div>
            <div className="header-actions">
              <span className="pill handle disabled">
                <FiMove />
              </span>
              <span className="pill danger disabled">
                <FiTrash2 />
              </span>
            </div>
          </div>
          <div className="block-body">
            <div className="row">
              <button type="button" className="dropdown-toggle control" disabled>
                {value.level}
              </button>
            </div>
            <input
              className="control input"
              type="text"
              value={value.text || ''}
              readOnly
              placeholder="Nhập nội dung tiêu đề..."
            />
          </div>
        </div>
      );
    }

    if (block.type === 'paragraph') {
      const textValue = Array.isArray(block.content)
        ? toPlainText(block.content)
        : toPlainText(block.content);
      return (
        <div className="block card is-sortable drag-overlay">
          <div className="block-header">
            <div className="left">
              <FiAlignLeft className="block-icon" />
              <span className="title">Đoạn văn</span>
            </div>
            <div className="header-actions">
              <span className="pill handle disabled">
                <FiMove />
              </span>
              <span className="pill danger disabled">
                <FiTrash2 />
              </span>
            </div>
          </div>
          <div className="block-body">
            <textarea
              className="control textarea rich-textarea"
              rows={5}
              readOnly
              value={textValue}
            />
          </div>
        </div>
      );
    }

    if (block.type === 'image') {
      const altValue = block.alt || '';
      const captionValue = block.caption || '';
      return (
        <div className="block card is-sortable drag-overlay">
          <div className="block-header">
            <div className="left">
              <FiImage className="block-icon" />
              <span className="title">Ảnh</span>
            </div>
            <div className="header-actions">
              <span className="pill handle disabled">
                <FiMove />
              </span>
              <span className="pill danger disabled">
                <FiTrash2 />
              </span>
            </div>
          </div>
          <div className="block-body">
            <div className="image-overlay-placeholder">
              <FiImage size={32} />
            </div>
            <div className="image-meta">
              <label className="control-label">Mô tả ảnh (alt)</label>
              <input className="control input" type="text" value={altValue} readOnly />
            </div>
            <div className="image-meta">
              <label className="control-label">Chú thích ảnh</label>
              <textarea className="control textarea" rows={2} value={captionValue} readOnly />
            </div>
          </div>
        </div>
      );
    }

    if (block.type === 'list') {
      const items = Array.isArray(block.content) ? block.content : [];
      return (
        <div className="block card is-sortable drag-overlay">
          <div className="block-header">
            <div className="left">
              <FiList className="block-icon" />
              <span className="title">Danh sách</span>
            </div>
            <div className="header-actions">
              <span className="pill handle disabled">
                <FiMove />
              </span>
              <span className="pill danger disabled">
                <FiTrash2 />
              </span>
            </div>
          </div>
          <div className="block-body">
            {items.length === 0 ? (
              <div className="list-preview-item empty">Danh sách trống</div>
            ) : (
              items.map((item, index) => (
                <div key={index} className="list-preview-item">
                  {toPlainText(item)}
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {showBlockButtons && (
        <div className="block-buttons">
          <button type="button" onClick={(e) => addBlock('heading', e)}>
            Heading
          </button>
          <button type="button" onClick={(e) => addBlock('paragraph', e)}>
            Paragraph
          </button>
          <button type="button" onClick={(e) => addBlock('image', e)}>
            Image
          </button>
          <button type="button" onClick={(e) => addBlock('list', e)}>
            List
          </button>
        </div>
      )}

      <div className="block-editor">
        {blocks.length === 0 && (
          <p className="empty">Chưa có nội dung. Thêm block đầu tiên!</p>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, idx) => {
              if (!block.id) return null;
              if (block.type === 'heading') {
                const value =
                  block.content && typeof block.content === 'object'
                    ? block.content
                    : { level: 'H2', text: '' };
                return (
                  <SortableBlock key={block.id} id={block.id}>
                    {({ setNodeRef, style, attributes, listeners, isDragging }) => (
                      <div
                        ref={setNodeRef}
                        style={style}
                        className={`block card is-sortable ${isDragging ? 'is-placeholder' : ''}`}
                      >
                        <div className="block-header">
                          <div className="left">
                            <FiType className="block-icon" />
                            <span className="title">Tiêu đề</span>
                          </div>
                          <div className="header-actions">
                            <button
                              type="button"
                              className="pill handle"
                              {...attributes}
                              {...listeners}
                              onClick={(e) => e.preventDefault()}
                              aria-label="Kéo để sắp xếp"
                            >
                              <FiMove />
                            </button>
                            <button
                              type="button"
                              className="pill danger"
                              onClick={() => removeBlock(idx)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        <div className="block-body">
                          <div className="row">
                            <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="dropdown-toggle control"
                                onClick={() =>
                                  setOpenDropdownIndex(openDropdownIndex === idx ? null : idx)
                                }
                              >
                                {value.level}
                              </button>
                              {openDropdownIndex === idx && (
                                <div className="dropdown-menu">
                                  {['H1', 'H2', 'H3'].map((lv) => (
                                    <div
                                      key={lv}
                                      className={`dropdown-item ${
                                        lv === value.level ? 'active' : ''
                                      }`}
                                      onClick={() => {
                                        setBlockContent(idx, { ...value, level: lv });
                                        setOpenDropdownIndex(null);
                                      }}
                                    >
                                      {lv}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <input
                            className="control input"
                            type="text"
                            placeholder="Nhập nội dung tiêu đề..."
                            value={value.text}
                            onChange={(e) =>
                              setBlockContent(idx, { ...value, text: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </SortableBlock>
                );
              }
              if (block.type === 'paragraph') {
                const value = block.content || [{ text: '' }];
                return (
                  <SortableBlock key={block.id} id={block.id}>
                    {({ setNodeRef, style, attributes, listeners, isDragging }) => (
                      <div
                        ref={setNodeRef}
                        style={style}
                        className={`block card is-sortable ${isDragging ? 'is-placeholder' : ''}`}
                      >
                        <div className="block-header">
                          <div className="left">
                            <FiAlignLeft className="block-icon" />
                            <span className="title">Đoạn văn</span>
                          </div>
                          <div className="header-actions">
                            <button
                              type="button"
                              className="pill handle"
                              {...attributes}
                              {...listeners}
                              onClick={(e) => e.preventDefault()}
                              aria-label="Kéo để sắp xếp"
                            >
                              <FiMove />
                            </button>
                            <button
                              type="button"
                              className="pill danger"
                              onClick={() => removeBlock(idx)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        <div className="block-body">
                          <RichTextEditor
                            value={value}
                            onChange={(newValue) => setBlockContent(idx, newValue)}
                            placeholder="Nhập nội dung đoạn văn..."
                          />
                        </div>
                      </div>
                    )}
                  </SortableBlock>
                );
              }
              if (block.type === 'image') {
                return (
                  <SortableBlock key={block.id} id={block.id}>
                    {({ setNodeRef, style, attributes, listeners, isDragging }) => (
                      <ImageBlock
                        block={block}
                        attributes={attributes}
                        listeners={listeners}
                        setNodeRef={setNodeRef}
                        style={style}
                        isDragging={isDragging}
                        onUpdate={(payload) => handleImageUpdate(idx, payload)}
                        onRemove={() => removeBlock(idx)}
                      />
                    )}
                  </SortableBlock>
                );
              }
              if (block.type === 'list') {
                const items = Array.isArray(block.content) ? block.content : [[{ text: '' }]];
                const setItem = (i, richTextValue) => {
                  const next = items.slice();
                  next[i] = richTextValue;
                  setBlockContent(idx, next);
                };
                const addItem = () => {
                  const next = [...items, [{ text: '' }]];
                  setBlockContent(idx, next);
                };
                const removeLast = () =>
                  setBlockContent(idx, items.length > 1 ? items.slice(0, -1) : items);
                return (
                  <SortableBlock key={block.id} id={block.id}>
                    {({ setNodeRef, style, attributes, listeners, isDragging }) => (
                      <div
                        ref={setNodeRef}
                        style={style}
                        className={`block card is-sortable ${isDragging ? 'is-placeholder' : ''}`}
                      >
                        <div className="block-header">
                          <div className="left">
                            <FiList className="block-icon" />
                            <span className="title">Danh sách</span>
                          </div>
                          <div className="header-actions">
                            <button
                              type="button"
                              className="pill handle"
                              {...attributes}
                              {...listeners}
                              onClick={(e) => e.preventDefault()}
                              aria-label="Kéo để sắp xếp"
                            >
                              <FiMove />
                            </button>
                            <button
                              type="button"
                              className="pill danger"
                              onClick={() => removeBlock(idx)}
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        <div className="block-body">
                          {items.map((item, i) => (
                            <div key={i} style={{ marginBottom: '8px' }}>
                              <ListItemEditor
                                value={item}
                                onChange={(newValue) => setItem(i, newValue)}
                                placeholder={`Mục ${i + 1}...`}
                              />
                            </div>
                          ))}
                          <div className="row gap">
                            <button type="button" className="btn primary" onClick={addItem}>
                              <FiPlus /> Thêm mục
                            </button>
                            <button type="button" className="btn outline" onClick={removeLast}>
                              Xóa mục cuối
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </SortableBlock>
                );
              }
              return null;
            })}
          </SortableContext>
          <DragOverlay modifiers={[restrictToVerticalAxis]}>
            {renderOverlayBlock(activeBlock)}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}

export default BlockEditor;
