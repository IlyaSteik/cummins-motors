import React, {PureComponent} from "react";
import PropTypes from 'prop-types';
import './button.css';

class Button extends PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const {before, after, className, size, children, onClick, onChange, shadow, mode, type, multiple} = this.props;
        const dataset = {};
        Object.keys(this.props).filter(value => value.startsWith('data-')).forEach(value => dataset[value] = this.props[value])
        return (
            React.createElement('button',
                {
                    onClick: (e) => {
                        if (type === 'file') {
                            this.input.click();
                        }

                        if (onClick && typeof onClick === 'function') {
                            onClick(e);
                        }
                    },
                    className: `button button-size-${size} button-mode-${mode} ${shadow ? 'button-shadow' : ''} ${className || ''}`,
                    ...dataset,
                    children: <React.Fragment>
                        {type === 'file' && <input type='file' ref={ref => this.input = ref} onChange={onChange} multiple={multiple}/>}
                        {before && <span className='button-before'>{before}</span>}
                        <span className='button-in'>{children}</span>
                        {after && <span className='button-after'>{after}</span>}
                    </React.Fragment>
                },
            )
        );
    }
}

Button.defaultProps = {
    size: 'l',
    mode: 'primary'
};

Button.propTypes = {
    type: PropTypes.oneOf(['button', 'file']),
    multiple: PropTypes.bool,
    mode: PropTypes.oneOf(['primary', 'secondary', 'icon']),
    shadow: PropTypes.bool,
    size: PropTypes.oneOf(['l', 'xl']),
    before: PropTypes.object,
    after: PropTypes.object,
    className: PropTypes.string,
    onClick: PropTypes.func,
    onChange: PropTypes.func
};

export default Button;