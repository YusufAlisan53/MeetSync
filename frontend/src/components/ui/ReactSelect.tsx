import React from 'react';
import Select, { StylesConfig, components, DropdownIndicatorProps, OptionProps, SingleValueProps } from 'react-select';
import { useTheme } from '../../context/ThemeContext';

export interface Option {
  value: string;
  label: string;
  isDisabled?: boolean;
  statusIcon?: React.ReactNode;
  statusText?: string;
  statusColor?: string;
}

interface ReactSelectProps {
  options: Option[];
  value?: Option | null;
  onChange: (option: Option | null) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  isSearchable?: boolean;
  className?: string;
}

// Custom Dropdown Indicator
const DropdownIndicator = (props: DropdownIndicatorProps<Option>) => (
  <components.DropdownIndicator {...props}>
    <svg 
      className="w-4 h-4 text-gray-400" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </components.DropdownIndicator>
);

// Custom Option Component
const CustomOption = (props: OptionProps<Option>) => {
  const { data } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full">
        <span className={data.isDisabled ? 'text-gray-400' : ''}>{data.label}</span>
        {data.statusIcon && (
          <div className={`flex items-center gap-1 text-xs ${data.statusColor}`}>
            {data.statusIcon}
            {data.statusText && <span>{data.statusText}</span>}
          </div>
        )}
      </div>
    </components.Option>
  );
};

// Custom Single Value Component
const CustomSingleValue = (props: SingleValueProps<Option>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center justify-between w-full">
        <span>{data.label}</span>
        {data.statusIcon && (
          <div className={`flex items-center gap-1 text-xs ${data.statusColor}`}>
            {data.statusIcon}
            {data.statusText && <span>{data.statusText}</span>}
          </div>
        )}
      </div>
    </components.SingleValue>
  );
};

export const ReactSelect: React.FC<ReactSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seçiniz...",
  isDisabled = false,
  isLoading = false,
  isClearable = false,
  isSearchable = true,
  className = ""
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const customStyles: StylesConfig<Option> = {
    control: (provided, state) => ({
      ...provided,
      minHeight: '44px', // h-11 equivalent
      backgroundColor: isDarkMode ? '#1f2937' : 'transparent',
      borderColor: state.isFocused 
        ? (isDarkMode ? '#1d4ed8' : '#3b82f6') 
        : (isDarkMode ? '#374151' : '#d1d5db'),
      borderRadius: '8px',
      borderWidth: '1.5px',
      boxShadow: state.isFocused 
        ? `0 0 0 3px ${isDarkMode ? 'rgba(29, 78, 216, 0.1)' : 'rgba(59, 130, 246, 0.1)'}` 
        : 'none',
      '&:hover': {
        borderColor: state.isFocused 
          ? (isDarkMode ? '#1d4ed8' : '#3b82f6') 
          : (isDarkMode ? '#4b5563' : '#9ca3af'),
      }
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: '2px 16px',
    }),
    input: (provided) => ({
      ...provided,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1f2937',
      fontSize: '14px',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#9ca3af',
      fontSize: '14px',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1f2937',
      fontSize: '14px',
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
      border: `1px solid ${isDarkMode ? '#374151' : '#d1d5db'}`,
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      zIndex: 50,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '4px',
      maxHeight: '200px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected 
        ? (isDarkMode ? '#1d4ed8' : '#3b82f6')
        : state.isFocused 
        ? (isDarkMode ? '#374151' : '#f3f4f6')
        : 'transparent',
      color: state.isSelected 
        ? '#ffffff'
        : state.isDisabled
        ? (isDarkMode ? '#6b7280' : '#9ca3af')
        : (isDarkMode ? 'rgba(255, 255, 255, 0.9)' : '#1f2937'),
      padding: '8px 12px',
      borderRadius: '6px',
      margin: '2px 0',
      fontSize: '14px',
      cursor: state.isDisabled ? 'not-allowed' : 'pointer',
      '&:hover': {
        backgroundColor: state.isSelected 
          ? (isDarkMode ? '#1d4ed8' : '#3b82f6')
          : state.isDisabled
          ? 'transparent'
          : (isDarkMode ? '#374151' : '#f3f4f6'),
      }
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
      padding: '8px',
      '&:hover': {
        color: isDarkMode ? '#d1d5db' : '#374151',
      }
    }),
    loadingIndicator: (provided) => ({
      ...provided,
      color: isDarkMode ? '#3b82f6' : '#1d4ed8',
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: isDarkMode ? '#9ca3af' : '#6b7280',
      padding: '8px',
      '&:hover': {
        color: isDarkMode ? '#ef4444' : '#dc2626',
      }
    }),
  };

  return (
    <Select<Option>
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isLoading={isLoading}
      isClearable={isClearable}
      isSearchable={isSearchable}
      styles={customStyles}
      components={{
        DropdownIndicator,
        Option: CustomOption,
        SingleValue: CustomSingleValue,
      }}
      className={className}
      classNamePrefix="react-select"
      noOptionsMessage={() => "Seçenek bulunamadı"}
      loadingMessage={() => "Yükleniyor..."}
    />
  );
};

export default ReactSelect;
