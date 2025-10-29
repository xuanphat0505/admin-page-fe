import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  FiEye,
  FiSearch,
  FiType,
  FiAlignLeft,
  FiImage,
  FiList,
  FiUploadCloud,
  FiChevronDown,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiRotateCcw,
  FiMoreHorizontal,
} from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../api';
import BlockEditor from '../BlockEditor/BlockEditor';

import './PostForm.scss';

const blockLibrary = [
  { type: 'heading', label: 'Heading', description: 'Add a section title', icon: FiType },
  { type: 'paragraph', label: 'Paragraph', description: 'Write rich text content', icon: FiAlignLeft },
  { type: 'image', label: 'Image', description: 'Upload or insert a picture', icon: FiImage },
  { type: 'list', label: 'List', description: 'Create a bullet list', icon: FiList },
];

const initialCategories = [
  { value: 'highlight', label: 'Highlight' },
  { value: 'popular', label: 'Popular' },
  { value: 'green-life', label: 'Green Life' },
  { value: 'chat', label: 'Chat' },
  { value: 'health', label: 'Health' },
];

const createBlock = (type) => {
  const base = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    content: null,
  };

  switch (type) {
    case 'heading':
      return { ...base, content: { level: 'H2', text: '' } };
    case 'paragraph':
      return { ...base, content: [{ text: '' }] };
    case 'list':
      return { ...base, content: [[{ text: '' }]] };
    case 'image':
      return { ...base, alt: '', caption: '' };
    default:
      return base;
  }
};

function PostForm() {
  const DESCRIPTION_LIMIT = 300;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState(initialCategories);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [showCategoryError, setShowCategoryError] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSites, setSelectedSites] = useState([]);
  const [showTargetSiteError, setShowTargetSiteError] = useState(false);
  const [blockSearch, setBlockSearch] = useState('');
  const [activeInspectorTab, setActiveInspectorTab] = useState('post');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      setIsFetchingCategories(true);
      try {
        const response = await api.get('/api/v1/categories');
        const categories = Array.isArray(response?.data?.data) ? response.data.data : [];
        if (categories.length > 0) {
          setCategoryOptions(categories);
        } else {
          setCategoryOptions(initialCategories);
        }
      } catch (error) {
        console.error('Lỗi lấy danh sách chuyên mục:', error);
        const message =
          error?.response?.data?.message || 'Không thể tải danh sách chuyên mục.';
        toast.error(message);
        setCategoryOptions(initialCategories);
      } finally {
        setIsFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(thumbnail);
    setThumbnailUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [thumbnail]);

  const dropRef = useRef(null);
  const titleRef = useRef(null);

  const availableSites = [
    { id: 'vinhomecangio', name: 'Vinhomes Green Paradise', url: 'http://vinhomecangio.vn/' },
    { id: 'thegioriverside', name: 'The Gio Riverside', url: 'http://angia.org.vn/' },
    { id: 'example', name: 'Example', url: 'http://example.com.vn/' },
  ];

  const filteredBlocks = useMemo(() => {
    const query = blockSearch.trim().toLowerCase();
    if (!query) return blockLibrary;
    return blockLibrary.filter((item) =>
      `${item.label} ${item.description}`.toLowerCase().includes(query)
    );
  }, [blockSearch]);

  const handleSiteToggle = (siteUrl) => {
    setSelectedSites((prev) => {
      const next = prev.includes(siteUrl)
        ? prev.filter((url) => url !== siteUrl)
        : [...prev, siteUrl];
      if (showTargetSiteError && next.length > 0) {
        setShowTargetSiteError(false);
      }
      return next;
    });
  };

  const handleSelectAllSites = () => {
    setSelectedSites(availableSites.map((site) => site.url));
    setShowTargetSiteError(false);
  };

  const handleDeselectAllSites = () => {
    setSelectedSites([]);
    setShowTargetSiteError(false);
  };

  const buildSelectedCategory = (option) => {
    if (!option) return null;
    const slug =
      typeof option.slug === 'string' && option.slug.trim()
        ? option.slug.trim()
        : typeof option.value === 'string'
        ? option.value.trim()
        : '';
    const label =
      typeof option.label === 'string' && option.label.trim()
        ? option.label.trim()
        : typeof option.value === 'string'
        ? option.value.trim()
        : '';
    if (!slug && !label) return null;
    return { value: label || slug, slug };
  };

  const handleCategoryToggle = (option) => {
    const normalized = buildSelectedCategory(option);
    if (!normalized) return;
    setSelectedCategories((prev) => {
      const exists = prev.some((item) => item.slug === normalized.slug);
      const next = exists
        ? prev.filter((item) => item.slug !== normalized.slug)
        : [...prev, normalized];
      if (showCategoryError && next.length > 0) setShowCategoryError(false);
      return next;
    });
  };

  const slugifyCategory = (input) => input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error('Vui lòng nhập tên chuyên mục.');
      return;
    }
    const slug = slugifyCategory(name) || name.toLowerCase();
    if (categoryOptions.some((item) => item.value === slug)) {
      toast.error('Chuyên mục đã tồn tại.');
      return;
    }
    try {
      setIsSavingCategory(true);
      const response = await api.post('/api/v1/categories', { name });
      const created = response?.data?.data;
      if (!created || !created.value) {
        throw new Error('Phản hồi không hợp lệ.');
      }
      const normalized = buildSelectedCategory({
        label: created.label,
        value: created.value,
      });
      setCategoryOptions((prev) => [...prev, created]);
      setSelectedCategories((prev) => {
        if (!normalized) return prev;
        if (prev.some((item) => item.slug === normalized.slug)) return prev;
        return [...prev, normalized];
      });
      setNewCategoryName('');
      setIsAddingCategory(false);
      setShowCategoryError(false);
      toast.success('Thêm chuyên mục thành công.');
    } catch (error) {
      console.error('Lỗi thêm chuyên mục:', error);
      const message =
        error?.response?.data?.message || 'Không thể tạo chuyên mục mới.';
      toast.error(message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleNewCategoryKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    }
  };

  useEffect(() => {
    if (titleRef.current) {
      const element = titleRef.current;
      element.style.height = 'auto';
      element.style.height = `${element.scrollHeight}px`;
    }
  }, [title]);

  const handleAddBlock = useCallback((type) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      toast.error('Vui lòng nhập tiêu đề.');
      return;
    }
    if (!trimmedDescription) {
      toast.error('Vui lòng nhập mô tả.');
      return;
    }
    if (trimmedDescription.length > DESCRIPTION_LIMIT) {
      toast.error(`Mô tả không được vượt quá ${DESCRIPTION_LIMIT} ký tự.`);
      return;
    }
    if (!thumbnail) {
      toast.error('Vui lòng chọn ảnh đại diện.');
      return;
    }
    if (!blocks.length) {
      toast.error('Cần ít nhất một block nội dung.');
      return;
    }
    if (selectedCategories.length === 0) {
      setShowCategoryError(true);
      toast.error('Chọn ít nhất một chuyên mục.');
      return;
    }
    if (selectedSites.length === 0) {
      setShowTargetSiteError(true);
      toast.error('Chọn ít nhất một website đăng tin.');
      return;
    }

    const hasMissingImageMeta = blocks.some((block) => {
      if (!block || block.type !== 'image') return false;
      const hasFile = block.content instanceof File;
      const contentUrl =
        typeof block.content === 'string' && block.content
          ? block.content.trim()
          : typeof block.url === 'string'
          ? block.url.trim()
          : '';
      if (!hasFile && !contentUrl) return false;
      const alt = (block.alt || '').trim();
      const caption = (block.caption || '').trim();
      return !alt || !caption;
    });

    if (hasMissingImageMeta) {
      toast.error('Ảnh phải có mô tả (alt) và chú thích.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('title', trimmedTitle);
      formData.append('description', trimmedDescription);
      formData.append('thumbnail', thumbnail);

      const processedBlocks = [];
      const imageFiles = [];

      blocks.forEach((block) => {
        if (!block) return;

        if (block.type === 'image') {
          const alt = (block.alt || '').trim();
          const caption = (block.caption || '').trim();

          if (block.content instanceof File) {
            imageFiles.push(block.content);
            processedBlocks.push({
              type: 'image',
              url: block.content.name,
              alt,
              caption,
            });
            return;
          }

          const existingUrl =
            typeof block.content === 'string' && block.content
              ? block.content.trim()
              : typeof block.url === 'string'
              ? block.url.trim()
              : '';

          processedBlocks.push({
            type: 'image',
            url: existingUrl,
            alt,
            caption,
          });
          return;
        }

        if (block.type === 'heading') {
          const value =
            block.content && typeof block.content === 'object'
              ? block.content
              : { level: 'H2', text: '' };

          processedBlocks.push({
            type: 'heading',
            level: (value.level || 'H2').toUpperCase(),
            text: (value.text || '').trim(),
          });
          return;
        }

        if (block.type === 'paragraph') {
          if (Array.isArray(block.content)) {
            processedBlocks.push({
              type: 'paragraph',
              richText: block.content,
              text: block.content.map((item) => item?.text || '').join('').trim(),
            });
          } else if (typeof block.content === 'string') {
            processedBlocks.push({
              type: 'paragraph',
              text: block.content.trim(),
            });
          } else if (typeof block.text === 'string') {
            processedBlocks.push({
              type: 'paragraph',
              text: block.text.trim(),
            });
          } else {
            processedBlocks.push({ type: 'paragraph', text: '' });
          }
          return;
        }

        if (block.type === 'list') {
          const items = Array.isArray(block.content) ? block.content : [];
          const normalizedItems = items.map((item) => {
            if (Array.isArray(item)) return item;
            if (typeof item === 'string') return [{ text: item }];
            if (Array.isArray(item?.richText)) return item.richText;
            return [];
          });
          processedBlocks.push({
            type: 'list',
            items: normalizedItems,
          });
          return;
        }

        processedBlocks.push(block);
      });

      imageFiles.forEach((file) => {
        formData.append('blockImages', file);
      });

      formData.append('content', JSON.stringify(processedBlocks));
      formData.append('categories', JSON.stringify(selectedCategories));
      formData.append('author', 'Admin');
      formData.append(
        'targetSites',
        JSON.stringify(selectedSites.length > 0 ? selectedSites : availableSites.map((site) => site.url))
      );

      const response = await api.post('/api/v1/news/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast.success('Đăng tin tức thành công.');
        setTitle('');
        setDescription('');
        setThumbnail(null);
        setBlocks([]);
        setSelectedCategories([]);
        setSelectedSites([]);
        setShowCategoryError(false);
        setShowTargetSiteError(false);
      } else {
        toast.error(response.data.message || 'Có lỗi xảy ra.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message || '';

      if (status === 409) {
        toast.error(serverMessage || 'Tiêu đề đã tồn tại.');
      } else if (status === 422) {
        toast.error(serverMessage || 'Dữ liệu không hợp lệ.');
      } else {
        toast.error(serverMessage || 'Không thể đăng tin tức.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setThumbnail(file);
  };

  const prevent = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const trimmedDescriptionLength = description.trim().length;
  const isDescriptionTooLong = trimmedDescriptionLength > DESCRIPTION_LIMIT;
  const hasNoCategorySelected = showCategoryError && selectedCategories.length === 0;
  const hasNoTargetSiteSelected = selectedSites.length === 0 && showTargetSiteError;
  const documentTitle = title.trim() || 'Không tiêu đề';

  return (
    <form className="wp-editor" onSubmit={handleSubmit}>
      <header className="wp-editor__topbar">
        <div className="topbar__left">
          <button type="button" className="bar-btn logo">W</button>
          <div className="bar-btn-group">
            <button type="button" className="bar-btn icon">
              <FiChevronLeft />
            </button>
            <button type="button" className="bar-btn icon">
              <FiChevronRight />
            </button>
            <button type="button" className="bar-btn icon">
              <FiRotateCcw />
            </button>
          </div>
        </div>
        <div className="topbar__center">
          <span className="document-title">{documentTitle}</span>
          <span className="document-type">Bai viet</span>
          <span className="shortcut-hint">Ctrl + K</span>
        </div>
        <div className="topbar__right">
          <span className="autosave">Lưu tự động</span>
          <button type="button" className="bar-btn text">Lưu bản nháp</button>
          <button type="button" className="bar-btn text">
            <FiEye /> Xem thử
          </button>
          <button type="submit" className="bar-btn primary" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng...' : 'Đăng bài'}
          </button>
          <button type="button" className="bar-btn icon">
            <FiMoreHorizontal />
          </button>
        </div>
      </header>

      <div className="wp-editor__workspace">
        <aside className="wp-editor__inserter">
          <div className="inserter__tabs">
            <button type="button" className="is-active">Blocks</button>
            <button type="button">Patterns</button>
            <button type="button">Media</button>
          </div>
          <div className="inserter__search">
            <FiSearch />
            <input
              type="text"
              placeholder="Tìm block"
              value={blockSearch}
              onChange={(e) => setBlockSearch(e.target.value)}
            />
          </div>
          <p className="inserter__caption">Chọn block để thêm vào trang</p>
          <div className="inserter__list">
            {filteredBlocks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.type}
                  className="inserter__item"
                  onClick={() => handleAddBlock(item.type)}
                >
                  <span className="item__icon">
                    <Icon size={18} />
                  </span>
                  <span className="item__meta">
                    <span className="item__label">{item.label}</span>
                    <span className="item__hint">{item.description}</span>
                  </span>
                </button>
              );
            })}
            {filteredBlocks.length === 0 && (
              <p className="inserter__empty">Không tìm thấy block phù hợp.</p>
            )}
          </div>
        </aside>

        <main className="wp-editor__canvas">
          <div className="canvas__wrapper">
            <div className="canvas__title">
              <textarea
                ref={titleRef}
                placeholder="Thêm tiêu đề..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                rows={1}
              />
            </div>
            <div className={`canvas__description ${isDescriptionTooLong ? 'is-invalid' : ''}`}>
              <textarea
                placeholder="Viết phần mô tả ngắn (tối đa 300 ký tự)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <div className="description__meta">
                <span className="description__hint">
                  Đoạn mô tả xuất hiện ở danh sách bài viết và giúp người đọc nắm nhanh nội dung.
                </span>
                <span className="char-counter">
                  {trimmedDescriptionLength}/{DESCRIPTION_LIMIT}
                </span>
              </div>
            </div>
            <BlockEditor blocks={blocks} setBlocks={setBlocks} showBlockButtons={false} />
            <div className="canvas__hint">Gõ / để mở danh sách block</div>
          </div>
        </main>

        <aside className="wp-editor__inspector">
          <div className="inspector__tabs">
            <button
              type="button"
              className={`inspector__tab ${activeInspectorTab === 'post' ? 'is-active' : ''}`}
              onClick={() => setActiveInspectorTab('post')}
            >
              Bài viết
            </button>
            <button
              type="button"
              className={`inspector__tab ${activeInspectorTab === 'block' ? 'is-active' : ''}`}
              onClick={() => setActiveInspectorTab('block')}
            >
              Block
            </button>
          </div>

          {activeInspectorTab === 'post' ? (
            <div className="inspector__content">
              <section className="settings-card">
                <header className="settings-card__header">
                  <span>Trạng thái & hiển thị</span>
                  <FiChevronDown />
                </header>
                <div className="settings-card__body">
                  <p className="settings-card__text">
                    Bản nháp chỉ hiển thị với đội biên tập. Đăng bài khi bạn sẵn sàng.
                  </p>
                  <div className="status-pill">
                    <FiCheck size={14} />
                    <span>Bản nháp đã được lưu gần đây</span>
                  </div>
                </div>
              </section>

              <section className="settings-card">
                <header className="settings-card__header">
                  <span>Chuyên mục</span>
                  <FiChevronDown />
                </header>
                  <div className="settings-card__body">
                    <div className={`checkbox-group ${hasNoCategorySelected ? 'is-invalid' : ''}`}>
                      {categoryOptions.length > 0 &&
                        categoryOptions.map((item) => (
                          <label key={item.value} className="checkbox-option">
                            <input
                              type="checkbox"
                              checked={selectedCategories.some((cat) => cat.slug === (item.slug || item.value))}
                              onChange={() => handleCategoryToggle({ label: item.label, value: item.value, slug: item.slug ? item.slug : item.value })}
                            />
                            <span>{item.label}</span>
                          </label>
                        ))}
                      {!isFetchingCategories && categoryOptions.length === 0 && (
                        <span className="checkbox-empty">Chưa có chuyên mục nào.</span>
                      )}
                      {isFetchingCategories && (
                        <span className="checkbox-hint checkbox-hint--muted">
                          Đang tải danh sách chuyên mục...
                        </span>
                      )}
                      {hasNoCategorySelected && (
                        <span className="checkbox-hint">Chọn ít nhất một chuyên mục.</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="category-add-toggle"
                      onClick={() => {
                        setIsAddingCategory((prev) => {
                          const next = !prev;
                          if (!next) setNewCategoryName('');
                          return next;
                        });
                      }}
                    >
                      + Thêm chuyên mục
                    </button>
                    {isAddingCategory && (
                      <div className="category-actions">
                        <input
                          type="text"
                          placeholder="Nhập chuyên mục mới..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={handleNewCategoryKeyDown}
                        />
                        <div className="category-actions__buttons">
                          <button type="button" onClick={handleAddCategory} disabled={isSavingCategory}>
                            {isSavingCategory ? 'Đang lưu...' : 'Thêm'}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => {
                              setIsAddingCategory(false);
                              setNewCategoryName('');
                            }}
                            disabled={isSavingCategory}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

              <section className="settings-card">
                <header className="settings-card__header">
                  <span>Website đăng tin</span>
                  <FiChevronDown />
                </header>
                <div className="settings-card__body">
                  <div className="settings-actions">
                    <button type="button" onClick={handleSelectAllSites}>
                      Chọn tất cả
                    </button>
                    <button type="button" onClick={handleDeselectAllSites}>
                      Bỏ chọn
                    </button>
                  </div>
                  <div className={`checkbox-group ${hasNoTargetSiteSelected ? 'is-invalid' : ''}`}>
                    {availableSites.map((site) => (
                      <label key={site.id} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={selectedSites.includes(site.url)}
                          onChange={() => handleSiteToggle(site.url)}
                        />
                        <span>
                          {site.name}
                          <small>{site.url}</small>
                        </span>
                      </label>
                    ))}
                    {hasNoTargetSiteSelected && (
                      <span className="checkbox-hint">
                        Chọn ít nhất một site để đăng tin.
                      </span>
                    )}
                  </div>
                </div>
              </section>

              <section className="settings-card">
                <header className="settings-card__header">
                  <span>Ảnh đại diện</span>
                  <FiChevronDown />
                </header>
                <div
                  ref={dropRef}
                  className={`featured-drop ${thumbnail ? 'has-image' : ''}`}
                  onDrop={onDrop}
                  onDragOver={prevent}
                  onDragEnter={prevent}
                  onDragLeave={prevent}
                >
                  {thumbnail ? (
                    <>
                      <img src={thumbnailUrl} alt="thumbnail preview" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => setThumbnail(null)}
                      >
                        Xóa ảnh
                      </button>
                    </>
                  ) : (
                    <div className="drop-inner">
                      <FiUploadCloud size={40} />
                      <p>Kéo ảnh vào đây hoặc</p>
                      <label className="upload-btn">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setThumbnail(e.target.files[0])}
                        />
                        Chọn ảnh
                      </label>
                    </div>
                  )}
                </div>
              </section>
            </div>
          ) : (
            <div className="inspector__placeholder">
              Chọn block trong trình soạn thảo để xem thiết lập.
            </div>
          )}
        </aside>
      </div>
    </form>
  );
}

export default PostForm;
