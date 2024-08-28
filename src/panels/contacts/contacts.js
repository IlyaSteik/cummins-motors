import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './contacts.css';

import Button from "../../components/button/button";
import Input, {Textarea} from "../../components/input/input";

import {ReactComponent as IconPhoto} from "../../assets/icons/photo.svg";
import {ReactComponent as IconVideo} from "../../assets/icons/video.svg";

import {
    apiUrl,
    checkErrorAuthToken, clearStringFromUrl, copyToClipboard,
    decOfNum, getBlob, getFile, getLocalStorageData, getRandomInt,
    multiIncludes, onFileChange, openLinkFromText, openUrl, setLocalStorageData,
    shortIntegers,
    skipMsgErrorCodes,
    sleep,
    vkApi, vkApiPost
} from "../../utils/utils";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";
import Checkbox from "../../components/checkbox/checkbox";
import {ScreenSpinner, DateInput, Spinner, IconButton} from "@vkontakte/vkui";
import {Icon24CopyOutline} from "@vkontakte/icons";

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {}

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    async componentDidMount() {

    }

    render() {
        const {main, style} = this.props;
        return (
            <div className='content-in content-contacts' style={style}>
                <h1>Связь с нами</h1>
                <h2>Если у вас появились какие-либо вопросы или предложения, мы всегда открыты и выслушаем вас</h2>
                <div className='flex flex-stretch'>
                    <Button
                        mode='secondary'
                        onClick={() => openUrl('https://vk.com/club200549734')}
                    >
                        Перейти в группу ВКонтакте
                    </Button>
                    <Button
                        onClick={() => openUrl('https://vk.me/id533031115')}
                    >
                        Написать администратору сайта
                    </Button>
                </div>
            </div>
        );
    }
}