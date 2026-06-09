// resources/js/Components/Admin/FormInput.jsx

export function FormInput({ label, required, error, children }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-xs font-semibold" style={{ color: "#0F2A44" }}>
                    {label}{" "}
                    {required && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
            )}
            {children}
            {error && (
                <p className="text-[10px]" style={{ color: "#ef4444" }}>{error}</p>
            )}
        </div>
    );
}

/** Returns inline style object for text/select inputs */
export function inputStyle(hasError) {
    return {
        background: "#f8fafc",
        border: `1.5px solid ${hasError ? "#ef4444" : "#c7e8f8"}`,
        color: "#0F2A44",
    };
}