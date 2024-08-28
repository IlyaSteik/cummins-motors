import React, {PureComponent} from "react";
import ReactDOM from "react-dom";

import './base.css';

import Button from "../../components/button/button";
import Input, {Textarea} from "../../components/input/input";

import {ReactComponent as IconPhoto} from "../../assets/icons/photo.svg";
import {ReactComponent as IconVideo} from "../../assets/icons/video.svg";

import {
    apiUrl,
    checkErrorAuthToken, clearStringFromUrl,
    decOfNum, getBlob, getFile, getLocalStorageData,
    multiIncludes, onFileChange, openUrl, setLocalStorageData,
    shortIntegers,
    skipMsgErrorCodes,
    sleep,
    vkApi, vkApiPost
} from "../../utils/utils";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";
import Checkbox from "../../components/checkbox/checkbox";
import {ScreenSpinner, DateInput, Spinner} from "@vkontakte/vkui";
import {ReactComponent as IconAddSquare} from "../../assets/icons/add_square.svg";

export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            limit: 100
        }

        this.componentDidUpdate = this.componentDidUpdate.bind(this);
    }

    async componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.style && this.props.style.display !== 'none' && !this.props.main.state[this.props.type === 'admin_base' ? 'story_base_admin_data' : 'story_base_data']) {
            const {main, type} = this.props;
            await main.updateStoryBase(type);
            this.forceUpdate();

            this.observer = new IntersectionObserver(
                this.handleObserver.bind(this),
                {
                    root: null,
                    rootMargin: '0px',
                    threshold: 1.0
                }
            );
            this.observer.observe(this.loadingRef);
        }
    }

    async handleObserver(entities = [{boundingClientRect: {y: 0}}], observer) {
        const
            {y} = entities[0].boundingClientRect,
            {prevY, limit} = this.state
        ;
        const {main, style, type} = this.props; // type: admin_base or base
        const story_key = type === 'admin_base' ? 'story_base_admin_data' : 'story_base_data';
        const story_data = main.state[story_key];
        if (story_data && (prevY === 0 || prevY > y) && limit < story_data.length) {
            await this.setState({limit: limit + 100});
        }
        this.setState({prevY: y});
    }

    render() {
        const {main, style, type} = this.props; // type: admin_base or base
        const story_key = type === 'admin_base' ? 'story_base_admin_data' : 'story_base_data';
        const story_data = main.state[story_key];
        const {limit} = this.state;

        return (
            <div className='content-in content-story-base' style={style}>
                <h1>{type === 'admin_base' ? 'Общие медиа' : 'База медиа'}</h1>
                <h2>Рекомендации к загрузке файлов</h2>
                <h3>Изображение: JPG, PNG, GIF (не более 10 Мб)</h3>
                <h3>Видеофайл: H.264, AAC, MP4 (720x1280, 30fps) (не более 50 Мб)</h3>
                <Button
                    type='file'
                    multiple={true}
                    size='xl'
                    before={<IconAddSquare/>}
                    className='add'
                    shadow={true}
                    onChange={async (e) => {
                        const data = await onFileChange(e, ['video', 'image']);
                        const files = [];
                        main.setPopout(<ScreenSpinner/>);
                        try {
                            for (const file of data) {
                                const file_type = file.type.split('/')[0];
                                const body = new FormData();
                                body.append('file', await getBlob(file.src), file.src.split('/')[1].split(';')[0]);
                                const data = await main.apiPost('uploadStory', {type, file_type}, body);
                                if (data.error) {
                                    throw new Error(data.error.message);
                                } else {
                                    files.push(data.response);
                                }
                            }
                            await main.setPopout(null);
                        } catch (e) {
                            await main.error(e);
                        }

                        if (files.length > 0) {
                            await main.setState({[story_key]: [...story_data, ...files]});
                            this.forceUpdate();
                        }
                    }}
                >
                    Добавить файлы
                </Button>
                {
                    story_data && Array.isArray(story_data) && story_data.length > 0 &&
                    <div className='edit-data'>
                        <div className='grid'>
                            {
                                story_data && Array.isArray(story_data) && story_data.slice(0, limit).map((value, index) =>
                                    <div
                                        key={`media-${index}`}
                                    >
                                        {
                                            value.type === 'image' ?
                                                <img
                                                    alt='img' src={value.full_url}
                                                    onClick={() => openUrl(value.full_url)}
                                                />
                                                :
                                                <video
                                                    src={value.full_url}
                                                    onClick={() => openUrl(value.full_url)}
                                                />
                                        }
                                        <span>
                                            <IconCancel
                                                style={{width: 16, height: 16}}
                                                onClick={async () => {
                                                    main.setPopout(<ScreenSpinner/>);
                                                    try {
                                                        await main.api('story.removeFile', {id: value.id, type}, true);
                                                        main.setPopout(null);

                                                        main.state[story_key].splice(index, 1);
                                                        await main.setState({[story_key]: main.state[story_key]});
                                                        this.forceUpdate();
                                                    } catch (e) {
                                                        main.error(e);
                                                    }
                                                }}
                                            />
                                        </span>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                }
                <div ref={ref => this.loadingRef = ref}/>
            </div>
        );
    }
}