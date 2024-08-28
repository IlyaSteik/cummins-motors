import React, {PureComponent} from "react";
import PropTypes from 'prop-types';
import './input.css';
import {isMobile} from "../../utils/utils";

export class Input extends PureComponent {

    constructor(props) {
        super(props);

        this.onPaste = this.onPaste.bind(this);
    }

    onPaste(e) {
        if (e.clipboardData.files && this.props.onPasteFile && typeof this.props.onPasteFile === 'function') {
            this.props.onPasteFile({target: e.clipboardData});
        }
    }

    componentDidMount() {
        this.input.addEventListener('paste', this.onPaste);
    }

    componentWillUnmount() {
        this.input.removeEventListener('paste', this.onPaste);
    }

    render() {
        const {title, after, className, placeholder, value, defaultValue, onChange, ref, disabled} = this.props;
        const dataset = {};
        Object.keys(this.props).filter(value => value.startsWith('data-')).forEach(value => dataset[value] = this.props[value]);
        return (
            <div className={`input ${className || ''}`} ref={ref => this.input = ref}>
                {title && <p className='title'>{title}</p>}
                <div className='input-in'>
                    {React.createElement('input', {
                        style: {
                            padding: isMobile() ? (after ? '7px 0px 7px 6px' : '7px 6px') : (after ? '14px 0px 14px 12px' : '14px 12px')
                        },
                        placeholder, value, onChange, ...dataset, ref, defaultValue, disabled
                    })}
                    {after && <span className='after'>{after}</span>}
                </div>
            </div>
        );
    }
}

Input.defaultProps = {};

Input.propTypes = {
    title: PropTypes.string,
    after: PropTypes.any,
    className: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.any,
    onChange: PropTypes.func,
    onPasteFile: PropTypes.func,
    disabled: PropTypes.bool
};


export class Textarea extends PureComponent {

    constructor(props) {
        super(props);
        this.onPaste = this.onPaste.bind(this);
    }

    onPaste(e) {
        if (e.clipboardData.files && this.props.onPasteFile && typeof this.props.onPasteFile === 'function') {
            this.props.onPasteFile({target: e.clipboardData});
        }
    }

    componentDidMount() {
        this.input.addEventListener('paste', this.onPaste);
    }

    componentWillUnmount() {
        this.input.removeEventListener('paste', this.onPaste);
    }

    autoResize(e) {
        e.target.style.height = 'auto';
        e.target.style.height = (e.target.scrollHeight - 24) + 'px';
    }

    render() {
        const {className, style, placeholder, value, defaultValue, onChange, ref, maxlength} = this.props;
        const dataset = {};
        Object.keys(this.props).filter(value => value.startsWith('data-')).forEach(value => dataset[value] = this.props[value])
        return (
            <div className={`textarea ${className || ''}`} style={style} ref={ref => this.input = ref}>
                <div className='textarea-in'>
                    {React.createElement('textarea', {
                        maxLength: maxlength,
                        placeholder, value, onChange: (e) => {
                            this.autoResize(e);
                            if (onChange && typeof onChange === 'function') {
                                onChange(e);
                            }
                        }, ...dataset, ref, defaultValue
                    })}
                </div>
            </div>
        );
    }
}

Textarea.defaultProps = {};

Textarea.propTypes = {
    className: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    onChange: PropTypes.func,
    onPasteFile: PropTypes.func
};

export default Input;