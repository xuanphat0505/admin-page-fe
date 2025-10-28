import RichTextEditor from './RichTextEditor';

function ListItemEditor({ value, onChange, placeholder = 'Nhập mục...' }) {
  return (
    <div className="list-item-editor">
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        variant="compact"
        showFormatHelp={false}
      />
    </div>
  );
}

export default ListItemEditor;
