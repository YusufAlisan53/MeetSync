import type React from "react";
import Select from 'react-select';
import { useTheme } from '../../context/ThemeContext';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: { value: string; text: string }[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  onChange,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Convert options to react-select format
  const selectOptions: Option[] = options.map(option => ({
    value: option.value,
    label: option.text
  }));

  // Convert default selected to react-select format
  const defaultValues = selectOptions.filter(option => 
    defaultSelected.includes(option.value)
  );

  const handleChange = (selectedOptions: any) => {
    const values = selectedOptions ? selectedOptions.map((option: Option) => option.value) : [];
    onChange?.(values);
  };

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '44px',
      backgroundColor: isDarkMode ? '#1f2937' : 'transparent',
      borderColor: state.isFocused 
        ? (isDarkMode ? '#1d4ed8' : '#3b82f6') 
        : (isDarkMode ? '#374151' : '#d1d5db'),
      borderRadius: '8px',
      borderWidth: '1px',
      boxShadow: state.isFocused 
        ? `0 0 0 3px ${isDarkMode ? 'rgba(29, 78, 216, 0.1)' : 'rgba(59, 130, 246, 0.1)'}` 
        : 'none',
      '&:hover': {
        borderColor: state.isFocused 
          ? (isDarkMode ? '#1d4ed8' : '#3b82f6') 
          : (isDarkMode ? '#4b5563' : '#9ca3af'),
      }
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#374151' : '#f3f4f6',
      borderRadius: '9999px',
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1f2937',
      fontSize: '14px',
    }),
    multiValueRemove: (provided: any) => ({
      ...provided,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
      '&:hover': {
        backgroundColor: isDarkMode ? '#ef4444' : '#dc2626',
        color: '#ffffff',
      }
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      border: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`,
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? (isDarkMode ? '#1d4ed8' : '#3b82f6')
        : state.isFocused 
        ? (isDarkMode ? '#374151' : '#f3f4f6')
        : 'transparent',
      color: state.isSelected 
        ? '#ffffff'
        : (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1f2937'),
      padding: '8px 12px',
      fontSize: '14px',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#9ca3af',
      fontSize: '14px',
    }),
    input: (provided: any) => ({
      ...provided,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1f2937',
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
    }),
  };

  return (
    <div className="w-full">
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>
      
      <Select
        isMulti
        options={selectOptions}
        defaultValue={defaultValues}
        onChange={handleChange}
        isDisabled={disabled}
        placeholder="Seçenek seçin"
        noOptionsMessage={() => "Seçenek bulunamadı"}
        styles={customStyles}
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
};

export default MultiSelect;
