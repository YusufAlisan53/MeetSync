import React from "react";
import ReactSelect, { Option } from "../ui/ReactSelect";

interface SelectProps {
  options: { value: string; label: string }[];
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  defaultValue?: string;
  value?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  placeholder = "Select an option",
  onChange,
  className = "",
  defaultValue = "",
  value
}) => {
  const reactSelectOptions: Option[] = options.map(option => ({
    value: option.value,
    label: option.label
  }));

  const selectedOption = reactSelectOptions.find(option => 
    option.value === (value !== undefined ? value : defaultValue)
  ) || null;

  const handleChange = (option: Option | null) => {
    onChange(option?.value || "");
  };

  return (
    <ReactSelect
      options={reactSelectOptions}
      value={selectedOption}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default Select;
