import React, {PureComponent} from "react";
import './content.css';

import PosterGroups from "../poster_groups/groups";
import PosterCheat from "../poster_cheat/poster_cheat";
import Poster from "../poster/poster";
import PosterRemove from "../poster_remove/poster_remove";
import PosterTasks from "../poster_tasks/poster_tasks";

import MailingGroups from "../mailing_groups/groups";
import MailingTemplates from "../mailing_templates/templates";
import Mailing from "../mailing/mailing";

import StoryMedia from "../story_base/base";
import StoryPoster from "../story_poster/story_poster";
import StoryTasks from "../story_tasks/story_tasks";

import Referals from "../referals/referals";
import Contacts from "../contacts/contacts";

import * as VKID from "@vkid/sdk";
import Button from "../../components/button/button";

export default class extends PureComponent {

    constructor(props) {
        super(props);
    }

    render() {
        const {main, isAuth, tab, header, time} = this.props;
        const {user_data} = main.state;
        return (
            <div className='content main-block'>
                {
                    isAuth && [
                        [
                            <PosterGroups main={main}/>, // сообщества
                            <PosterCheat main={main}/>, // накрутка
                            <Poster main={main}/>, // постинг
                            <PosterRemove main={main}/>, // удаление постов
                            <PosterTasks main={main}/>, // текущие задачи
                        ],
                        [
                            <PosterGroups main={main}/>, // сообщества
                            ...(user_data && user_data.admin) ? [
                                <StoryMedia main={main} type='admin_base'/> // общие медиа
                            ] : [],
                            <StoryMedia main={main} type='base'/>, // медиа
                            <StoryPoster main={main}/>, // постинг
                            <StoryTasks main={main}/>, // текущие задачи
                        ],
                        [
                            <MailingGroups main={main}/>, // сообщества
                            <MailingTemplates main={main}/>, // шаблоны
                            <Mailing main={main}/>, // рассылка
                        ],
                        [
                            <Referals main={main}/>, // реферальная система
                            <Contacts main={main} />, // контакты
                        ]
                    ].map((head, ind) =>
                        head.map((e, i) =>
                                e && React.cloneElement(e, {
                                    style: {
                                        display: isAuth && (i === tab && ind === header) ? '' : 'none'
                                    },
                                    key: `content-${i}`
                                })
                        )
                    )
                }
                {
                    !isAuth &&
                    <div className='content-in content-auth'>
                        <h1>Упс 😳</h1>
                        <h2>Авторизуйтесь через ВКонтакте, чтобы получить доступ к функционалу</h2>
                        {
                            main.mobile &&
                            <Button
                                onClick={() => {
                                    VKID.Auth.login()
                                }}
                            >
                                Войти через VK
                            </Button>
                        }
                    </div>
                }
            </div>
        );
    }
}