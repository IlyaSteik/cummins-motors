import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './referals.css';

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

        this.state = {
            copy: false
        }

        this.componentDidMount = this.componentDidMount.bind(this);
    }

    async componentDidMount() {
        //const referals = new Array(20).fill(0).map(v => getRandomInt(10000, 999999999));
        const {user_data} = this.props.main.state;
        const {referals, access_token} = user_data;
        if (referals.length > 0) {
            const ref_data = await vkApi('users.get', {user_ids: referals, fields: 'photo_100', access_token});
            console.log({ref_data});
            if (ref_data && ref_data.response) {
                this.setState({ref_data: ref_data.response});
            }
        }
    }

    render() {
        const {main, style} = this.props;
        const {user_data} = main.state;
        const {copy, ref_data} = this.state;

        return (
            user_data && <div className='content-in content-referals' style={style}>
                <h1>Реферальная система</h1>
                <h2>Приглашайте пользователей по своей реферальной ссылке:</h2>
                <div className='flex'>
                    <Input
                        value={`https://adminbase.ru/?r=${user_data.id}`}
                        disabled
                    />
                    {
                        copy ?
                            <Button
                                mode='secondary'
                            >
                                Скопировано!
                            </Button>
                            :
                            <Button
                                onClick={() => {
                                    copyToClipboard(`https://adminbase.ru/?r=${user_data.id}`);
                                    this.setState({copy: !copy});
                                    setTimeout(() => {
                                        this.setState({copy});
                                    }, 2000);
                                }}
                            >
                                Скопировать
                            </Button>
                    }
                </div>
                {
                    ref_data && Array.isArray(ref_data) && <React.Fragment>
                        <h2 style={{margin: '12px 0 12px 0'}}>Ваши рефералы:</h2>
                        <div className='referals'>
                            {
                                ref_data.map((v, i) => <div key={`ref-${i}`}>
                                    <img alt='ava' src={v.photo_100}/>
                                    <span>{v.first_name} {v.last_name}</span>
                                </div>)
                            }
                        </div>
                    </React.Fragment>
                }
            </div>
        );
    }
}