import React, {PureComponent} from "react";
import PropTypes from 'prop-types';
import './select.css';

export class Select extends PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const {title, after, className, placeholder, value, defaultValue, onChange, ref, options} = this.props;
        const dataset = {};
        Object.keys(this.props).filter(value => value.startsWith('data-')).forEach(value => dataset[value] = this.props[value])
        return (
            <div className={`select ${className || ''}`}>
                {title && <p className='title'>{title}</p>}
                <div className='select-in'>
                    {React.createElement('select', {
                        style: {
                            padding: '14px 12px',
                            marginRight: '12px'
                        },
                        placeholder, value, onChange, ...dataset, ref, defaultValue,
                        children: options.map(value => <option value={value.value}>{value.label}</option>)
                    })}
                    {after && <span className='after'>{after}</span>}
                </div>
            </div>
        );
    }
}

Select.defaultProps = {};

Select.propTypes = {
    options: PropTypes.arrayOf(PropTypes.object),
    title: PropTypes.string,
    className: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.any,
    onChange: PropTypes.func
};

export default Select;