import React, {PureComponent} from "react";
import './groups.css';

import Input from "../../components/input/input";
import Button from "../../components/button/button";

import {ReactComponent as IconSearch} from "../../assets/icons/search.svg";
import {ReactComponent as IconAddSquare} from "../../assets/icons/add_square.svg";
import {ReactComponent as IconUpdate} from "../../assets/icons/update.svg";
import {ReactComponent as IconEdit} from "../../assets/icons/edit.svg";
import {ReactComponent as IconRemove} from "../../assets/icons/remove.svg";
import {ReactComponent as IconCancel} from "../../assets/icons/cancel.svg";

import {api, getTokenFromStr, reorder, setLocalStorageData, shortIntegers, sleep, vkApi} from "../../utils/utils";
import {ScreenSpinner, Spinner} from "@vkontakte/vkui";
import Checkbox from "../../components/checkbox/checkbox";
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";

let token_timeout;
export default class extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            searchText: '',
            searchGroups: []
        }

        this.onSearch = this.onSearch.bind(this);
        this.renderGroupRow = this.renderGroupRow.bind(this);
        this.renderGroupEditRow = this.renderGroupEditRow.bind(this);
    }

    onSearch(e) {
        this.setState({[e.target.dataset.key]: e.target.value});
    }

    async changeEditMode(id) {
        //console.log(`change edit mode ${id}`);
        if (id === -1) {
            const isHide = this[`div-edit_${id}`].style.display === 'flex';
            if (isHide) {
                this[`div-edit_${id}`].style.display = 'none';
            } else {
                this[`div-edit_${id}`].style.display = 'flex';
            }
        } else {
            const {editRow} = this;
            if (editRow > 0) {
                this[`div-view_${editRow}`].style.display = 'flex';
                this[`div-edit_${editRow}`].style.display = 'none';
            }
            if (id > 0) {
                this[`div-view_${id}`].style.display = 'none';
                this[`div-edit_${id}`].style.display = 'flex';
            }
            this.editRow = id;
        }
    }

    renderGroupEditRow({
                           access_token,
                           access_token_admin,
                           members,
                           group_id,
                           name,
                           screen_name,
                           photo_100,
                           proxy
                       }, index) {
        const {main} = this.props;
        const {searchGroups} = this.state;

        const getInputFieldsData = () => {
            const data = index === -1 ? {
                group_ids: []
            } : {};
            [...this[`div-edit_${group_id}`].getElementsByTagName('input')].forEach(input =>
                data[input.dataset.key] = input.value
            );
            if (data.token) {
                data.token = getTokenFromStr(data.token);
            }
            if (index === -1) {
                [...this[`div-edit_${group_id}`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')].forEach(block => {
                    const checked = block.getElementsByTagName('input')[0].checked;
                    if (checked) {
                        data.group_ids.push(parseInt(block.className.split('_')[1]));
                    }
                });
            }
            return data;
        }
        const data_keys = ['name', 'group_url', 'token', 'proxy', 'token_admin'];

        const selectData = (key) => {
            const block = this[`div-edit_${group_id}`].getElementsByClassName(key)[0];
            const checkBox = block.getElementsByClassName('checkbox')[0];
            const isSelected = checkBox.checked;

            if (isSelected) {
                block.style.outline = 'none';
                checkBox.checked = '';
            } else {
                block.style.outline = '2px solid var(--color_accent)';
                checkBox.checked = 'checked';
            }
        };

        return <div
            className='edit-data'
            ref={ref => this[`div-edit_${group_id}`] = ref}
            style={{display: 'none'}}
        >
            <h2>
                {index === -1 ? 'Введите данные вашего сообщества' : 'Редактирование данных сообщества'}
                <span className='right'>
                    <IconCancel onClick={() => this.changeEditMode(index === -1 ? index : 0)}/>
                    {index !== -1 && <IconRemove onClick={async () => {
                        main.setPopout(<ScreenSpinner/>);
                        await main.api('groups.remove', {group_id, type: 1}, true);
                        await main.updatePosterGroups();
                        main.setPopout(null);
                    }}/>}
                </span>
            </h2>
            {false &&
                <Input
                    data-key={data_keys[0]}
                    placeholder='Введите название сообщества'
                    defaultValue={name}
                />
            }
            <div className='flex flex-stretch'>
                {false &&
                    <Input
                        data-key={data_keys[1]}
                        title='Ссылка на сообщество'
                        defaultValue={index !== -1 ? `https://vk.com/${screen_name}` : ''}
                    />
                }
                <Input
                    data-key={data_keys[2]}
                    title='Токен админа'
                    defaultValue={access_token}
                    onChange={e => {
                        if (index !== -1) {
                            return;
                        }
                        if (token_timeout) {
                            clearTimeout(token_timeout);
                        }
                        token_timeout = setTimeout(async () => {
                            const access_token = getTokenFromStr(e.target.value);
                            if (access_token.length === 0) {
                                this.setState({searchGroups: []});
                            } else {
                                const groups = await vkApi('groups.get', {
                                    access_token,
                                    extended: 1,
                                    filter: 'admin,editor'
                                });

                                if (groups.error) {
                                    main.error(groups.error.error_msg);
                                } else {
                                    this.setState({searchGroups: groups.response.items});
                                }
                            }
                        }, 1000);
                    }}
                />
                <Input
                    data-key={data_keys[3]}
                    title='Прокси для постинга'
                    placeholder='Необязательное поле (login:password@ip:port)'
                    defaultValue={proxy}
                />
            </div>
            {
                index === -1 &&
                <div className='block'>
                    <div className='flex flex-select'>
                        <h2>Выберите сообщества</h2>
                        <span
                            className='clickable'
                            onClick={() => {
                                searchGroups.forEach(group => selectData(`group-view_${group.id}`));
                            }}
                        >
                            Выбрать все
                        </span>
                    </div>
                    <Input
                        placeholder='Поиск'
                        onChange={e => {
                            [
                                ...this[`div-edit_${group_id}`].getElementsByClassName('content-groups')[0].getElementsByClassName('table-in')[0].getElementsByTagName('div')
                            ].forEach(block => {
                                const name = block.getElementsByClassName('text')[0].innerText;
                                if (!name.toLowerCase().includes(e.target.value.toLowerCase())) {
                                    block.style.display = 'none';
                                } else {
                                    block.style.display = 'flex';
                                }
                            });
                        }}
                    />
                    <div className='content-groups content-select'>
                        <div className='table'>
                            <div className='table-in'>
                                {
                                    searchGroups && searchGroups.map(({
                                                                          id,
                                                                          name,
                                                                          screen_name,
                                                                          photo_100
                                                                      }, index) => {
                                            return <div
                                                className={`group-view group-view_${id}`}
                                                onClick={() => {
                                                    selectData(`group-view_${id}`);
                                                }}
                                                key={`group-${index}`}
                                            >
                                                <img className='icon' alt='icon' src={photo_100}/>
                                                <span className='number'>{index + 1}</span>
                                                <span className='text'>{name}</span>
                                                <span className='text text-url'>@{screen_name}</span>
                                                <Checkbox onChange={e => {
                                                    selectData(`group-view_${id}`);
                                                }}/>
                                            </div>;
                                        }
                                    )
                                }
                            </div>
                        </div>
                    </div>
                </div>
            }
            <div className='flex flex-stretch'>
                {
                    index === -1 ?
                        <Button
                            size='l'
                            onClick={async () => {
                                try {
                                    const data = getInputFieldsData();
                                    console.log({data});
                                    if (data.group_ids.length === 0) {
                                        main.error('Вы не выбрали группы.');
                                        return;
                                    }
                                    main.setPopout(<ScreenSpinner/>);
                                    const req = await main.api('groups.add', {type: 1, ...data}, true);
                                    main.setPopout(null);
                                    console.log({req});
                                    this.changeEditMode(-1);
                                    main.updatePosterGroups();
                                    main.updateCheats();
                                } catch (e) {
                                    console.error(e);
                                    main.error(e);
                                }
                            }}
                        >
                            Добавить
                        </Button>
                        :
                        <Button
                            size='l'
                            onClick={async () => {
                                try {
                                    const data = getInputFieldsData();
                                    console.log({data});
                                    main.setPopout(<ScreenSpinner/>);
                                    const req = await main.api('groups.edit', {group_id, type: 1, ...data}, true);
                                    main.setPopout(null);
                                    console.log({req});
                                    this.changeEditMode(0);
                                    main.updatePosterGroups();
                                } catch (e) {
                                    console.error(e);
                                    main.error(e);
                                }
                            }}
                        >
                            Сохранить
                        </Button>
                }
            </div>
        </div>
    }

    renderGroupRow({access_token, access_token_admin, members, group_id, name, screen_name, photo_100, proxy}, index) {
        const {main} = this.props;

        return <React.Fragment key={`row-${index}`}>
            <Draggable
                key={group_id} draggableId={`${group_id}`}
                index={index}
            >
                {
                    (provided, snapshot) =>
                        <div
                            ref={ref => {
                                this[`div-view_${group_id}`] = ref;
                                provided.innerRef(ref);
                            }}
                            className={members ? '' : 'error'}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                                ...provided.draggableProps.style,
                                ...(snapshot.isDragging ? {
                                    userSelect: 'none',
                                    background: 'white'
                                } : {})
                            }}
                        >
                            <img className='icon' alt='icon' src={photo_100}/>
                            <span className='number'>{index + 1}</span>
                            <span className='text'>{name}</span>
                            <span className='text text-flex'>
                                <IconUpdate style={{display: 'none'}}/> Подписчиков: {shortIntegers(members)}
                            </span>
                            <span className='text text-url'
                                  onClick={() => open(`https://vk.com/${screen_name}`)}>@{screen_name}</span>
                            <span className='actions'>
                                <IconEdit onClick={() => this.changeEditMode(group_id)}/>
                                <IconRemove onClick={async () => {
                                    main.setPopout(<ScreenSpinner/>);
                                    await main.api('groups.remove', {group_id, type: 1}, true);
                                    await main.updatePosterGroups();
                                    main.setPopout(null);
                                }}/>
                            </span>
                            {provided.placeholder}
                        </div>
                }
            </Draggable>
            {this.renderGroupEditRow({
                access_token,
                access_token_admin,
                members,
                group_id,
                name,
                screen_name,
                photo_100,
                proxy
            }, index)}
        </React.Fragment>
    }

    render() {
        const {main, style} = this.props;
        const {searchText} = this.state;
        const {poster_groups_data} = main.state;
        return (
            <div className='content-in content-poster-groups' style={style}>
                <h1>Сообщества</h1>
                <Input
                    data-key='searchText'
                    className='search'
                    placeholder='Воспользуйтесь поисковой строкой...'
                    value={searchText}
                    onChange={this.onSearch}
                    after={false && <IconSearch
                        onClick={() => {
                            console.log('test');
                        }}
                    />}
                />
                <Button
                    size='xl'
                    before={<IconAddSquare/>}
                    className='add'
                    shadow={true}
                    onClick={() => this.changeEditMode(-1)}
                >
                    Добавить сообщество
                </Button>
                {this.renderGroupEditRow({group_id: -1}, -1)}
                <DragDropContext onDragEnd={async result => {
                    if (!result.destination) {
                        return;
                    }

                    await main.setState({
                        poster_groups_data: reorder(
                            poster_groups_data,
                            result.source.index,
                            result.destination.index
                        )
                    });
                    await main.api('users.savePosterGroupsOrder', {group_ids: main.state.poster_groups_data.map(value => value.group_id)});
                    //setLocalStorageData('poster_groups_order', main.state.poster_groups_data.map(value => value.group_id));
                }}>
                    <Droppable droppableId="droppable">
                        {
                            (provided, snapshot) =>
                                <div
                                    className='table'
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                >
                                    <div className='table-header'>
                                        <span>№</span>
                                        <span>Название</span>
                                        <span>Кол-во подписчиков</span>
                                        <span>Ссылка</span>
                                    </div>
                                    <div className='table-in'>
                                        {
                                            poster_groups_data && Array.isArray(poster_groups_data) && poster_groups_data
                                                .filter(value => searchText ? value.name.toLowerCase().includes(searchText.toLowerCase()) : true)
                                                .map(this.renderGroupRow)
                                        }
                                        {
                                            !poster_groups_data &&
                                            <Spinner size='medium'/>
                                        }
                                    </div>
                                </div>
                        }
                    </Droppable>
                </DragDropContext>
            </div>
        );
    }
}