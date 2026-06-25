export default function PageHeader({ title, description, children }) {
  return (
    <div className="page-header">
      <div className="min-w-0 flex-1">
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-description">{description}</p>}
      </div>
      {children && <div className="page-actions">{children}</div>}
    </div>
  );
}
