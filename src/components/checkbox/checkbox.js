import React, {PureComponent} from "react";
import PropTypes from 'prop-types';
import './checkbox.css';

export class  Checkbox extends PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const {id, className, checked, defaultChecked, onChange, ref} = this.props;
        const dataset = {};
        Object.keys(this.props).filter(value => value.startsWith('data-')).forEach(value => dataset[value] = this.props[value])
        return (
            React.createElement('input', {
                id,
                type: 'checkbox',
                className: `checkbox ${className || ''}`,
                checked, defaultChecked, ...dataset, ref,
                onChange
            })
        );
    }
}

Checkbox.defaultProps = {};

Checkbox.propTypes = {
    className: PropTypes.string,
    checked: PropTypes.string,
    defaultChecked: PropTypes.bool,
    onChange: PropTypes.func
};

export default Checkbox;