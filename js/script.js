var player = new Image();
player.src = 'image/player.bmp';

var cement = new Image();
cement.src = 'image/cement.bmp';

var cement2 = new Image();
cement2.src = 'image/cement2.bmp';

var cement3 = new Image();
cement3.src = 'image/cement3.bmp';

var cement4 = new Image();
cement4.src = 'image/cement4.bmp';

var wall_even = new Image();
wall_even.src = 'image/wall_even.bmp';

var wall_even_left = new Image();
wall_even_left.src = 'image/wall_even_left.bmp';

var gblok = new Image();
gblok.src = 'image/gblok.bmp';

var gblokcrash = new Image();
gblokcrash.src = 'image/gblokcrash.bmp';

var gblokcrash2 = new Image();
gblokcrash2.src = 'image/gblokcrash2.bmp';

var wall_even_right = new Image();
wall_even_right.src = 'image/wall_even_right.bmp';

var wall_even_middle = new Image();
wall_even_middle.src = 'image/wall_even_middle.bmp';

var wall_odd = new Image();
wall_odd.src = 'image/wall_odd.bmp';

var wall_odd_left = new Image();
wall_odd_left.src = 'image/wall_odd_left.bmp';

var wall_odd_right = new Image();
wall_odd_right.src = 'image/wall_odd_right.bmp';

var wall_odd_middle = new Image();
wall_odd_middle.src = 'image/wall_odd_middle.bmp';

var stone = new Image();
stone.src = 'image/stone.bmp';

var gold = new Image();
gold.src = 'image/gold.bmp';

var space = new Image();
space.src = 'image/space.bmp';

var ground = new Image();
ground.src = 'image/ground.bmp';

var flag = new Image();
flag.src = 'image/flag.bmp';

var audio_move_player = new Audio();
audio_move_player.src = 'audio/move_player.wav';

var audio_steklo = new Audio();
audio_steklo.src = 'audio/steklo.mp3';

var audio_get_gold = new Audio();
audio_get_gold.src = 'audio/get_gold.wav';

var game = document.getElementById('game');
var cntx = game.getContext('2d');

// Текущие координаты Игрока
var _cur_x = 2;
var _cur_y = 3;

// Базовый размер спрайта
var BASE_SPRITE_SIZE = 60;
var size_sprite = BASE_SPRITE_SIZE;

// Настройки камеры
var camera_x = 0;
var camera_y = 0;

// Количество клеток в видимой области
var camera_columns = 10;
var camera_rows = 10;

// Количество собранного золота
var count_gold = 0;
var cur_count_gold = 0;

// Номер текущего уровня
var number_level = -1;

// Номер итерации для анимации
var halfway = 0 | 0;

// Хранилище перемещений персонажей
var moves = [];
var cur_moves = [];
var index_moves = [];
var cur_x_players = [];
var cur_y_players = [];

// Текущее время игры
var time_game = 0;

var dx = [0, 0, 0, 1, -1];
var dy = [0, -1, 1, 0, 0];
var standing = 0;
var up = 1;
var down = 2;
var right = 3;
var left = 4;

var global_direction = standing;

var area = [];
var move = [];
var used = [];

if (typeof levels === 'undefined' || levels.length === 0) {
    alert("ОШИБКА\nУровни не загрузились");
}

function clear_move_and_used() {
    for (var y = 0; y < move.length; ++y) {
        for (var x = 0; x < move[y].length; ++x) {
            move[y][x] = standing;
            used[y][x] = false;
        }
    }
}

function load_level_to_area_and_area_old(level) {
    var cur_level = levels[level];
    var cur_area = cur_level.level;

    cur_x_players = [];
    cur_y_players = [];
    for (var i = 0; i < moves.length; ++i) {
        cur_x_players.push(cur_level.player[i].x);
        cur_y_players.push(cur_level.player[i].y);
    }

    cur_count_gold = 0;
    area = [];
    move = [];
    used = [];
    for (var y = 0; y < cur_area.length; ++y) {
        area.push(cur_area[y].split(''));
        move.push([]);
        used.push([]);
        for (var x = 0; x < area[y].length; ++x) {
            move[y].push(0);
            used[y].push(false);
        }
    }

    _cur_x = cur_level.player[moves.length].x;
    _cur_y = cur_level.player[moves.length].y;

    moves.push([]);
    index_moves.push(0);
    for (var i = 0; i < moves.length; ++i) {
        index_moves[i] = 0;
    }

    cur_moves = moves[moves.length - 1];

    for (var i = 0; i < moves.length; ++i) {
        var player_i = cur_level.player[i];
        if (area[player_i.y][player_i.x] == '+' || area[player_i.y][player_i.x] == '-') {
            audio_get_gold.play();
            ++cur_count_gold;
        }
        area[player_i.y][player_i.x] = 'P';
    }

    time_game = 0;
}

function next_level() {
    count_gold += cur_count_gold;
    moves = [];

    if (++number_level >= levels.length) {
        number_level = 0;
    }

    load_level_to_area_and_area_old(number_level);
    draw();
}

function update_camera() {
    if (!area.length || !area[0]) return;

    var board = document.querySelector('.game-board');
    var available_width = board ? board.clientWidth : window.innerWidth;
    var available_height = board ? board.clientHeight : window.innerHeight;

    // clientWidth/clientHeight включают padding. На мобильных этот padding
    // резервируется под экранные кнопки, поэтому холст считает только контентную
    // область и не оказывается под D-pad.
    if (board) {
        var board_style = window.getComputedStyle(board);
        available_width -= parseFloat(board_style.paddingLeft) + parseFloat(board_style.paddingRight);
        available_height -= parseFloat(board_style.paddingTop) + parseFloat(board_style.paddingBottom);
    }

    // Достаточно места для минимального окна 3x3 клетки по 28px. Это важнее,
    // чем прежний минимум 160px на очень низких экранах в landscape.
    available_width = Math.max(84, available_width);
    available_height = Math.max(84, available_height);

    var max_cols = area[0].length;
    var max_rows = area.length;

    // Рассчитываем размер клетки так, чтобы вся карта или большая её часть вмещалась
    var ideal_tile_w = available_width / max_cols;
    var ideal_tile_h = available_height / max_rows;

    size_sprite = Math.max(28, Math.min(BASE_SPRITE_SIZE, Math.floor(Math.min(ideal_tile_w, ideal_tile_h))));

    camera_columns = Math.min(max_cols, Math.floor(available_width / size_sprite));
    camera_rows = Math.min(max_rows, Math.floor(available_height / size_sprite));

    camera_columns = Math.max(3, camera_columns);
    camera_rows = Math.max(3, camera_rows);

    camera_x = Math.max(0, Math.min(max_cols - camera_columns, _cur_x - Math.floor(camera_columns / 2)));
    camera_y = Math.max(0, Math.min(max_rows - camera_rows, _cur_y - Math.floor(camera_rows / 2)));

    var target_width = camera_columns * size_sprite;
    var target_height = camera_rows * size_sprite;

    if (game.width !== target_width) game.width = target_width;
    if (game.height !== target_height) game.height = target_height;
}

next_level();

function move_objects() {
    time_game++;
    clear_move_and_used();

    var was_move = false;
    for (var y = area.length - 2; y > 0; --y) {
        for (var x = 1; x < area[y].length - 1; ++x) {
            if (move[y][x] != standing) continue;
            if (area[y][x] == 'o' || area[y][x] == '-' || (area[y][x] >= '4' && area[y][x] <= '7')) {
                if (area[y + 1][x] === ' ' && !used[y + 1][x]) {
                    area[y + 1][x] = area[y][x];
                    area[y][x] = ' ';
                    move[y + 1][x] = down;
                    used[y + 1][x] = true;
                    was_move = true;
                } else if (area[y + 1][x] == 'P' && (move[y + 1][x] == standing || move[y + 1][x] == up)) {
                    if (area[y][x] == 'o') area[y][x] = 'O';
                    if (area[y][x] == '-') area[y][x] = '+';
                    if (area[y][x] >= '4' && area[y][x] <= '7') area[y][x] = area[y][x] - 4;
                } else if (area[y + 1][x] == 'b' && (move[y + 1][x] == standing || move[y + 1][x] == up)) {
                    area[y + 1][x] = 'z';
                    audio_steklo.play();
                    if (area[y][x] == 'o') area[y][x] = 'O';
                    if (area[y][x] == '-') area[y][x] = '+';
                    if (area[y][x] >= '4' && area[y][x] <= '7') area[y][x] = area[y][x] - 4;
                } else if (area[y][x] == 'o') {
                    if (area[y + 1][x] >= '0' && area[y + 1][x] <= '2') {
                        ++area[y + 1][x];
                        area[y][x] = ' ';
                    } else area[y][x] = 'O';
                } else if (area[y][x] == '-') area[y][x] = '+';
                else if (area[y][x] >= '4' && area[y][x] <= '7') area[y][x] = area[y][x] - 4;
                continue;
            }

            if (area[y][x] == 'z1') {
                area[y][x] = ' ';
                used[y + 1][x] = true;
                continue;
            }

            if (area[y][x] == 'z') {
                area[y][x] = 'z1';
                used[y + 1][x] = true;
                continue;
            }

            if (area[y][x] == 'O' && area[y + 1][x] === ' ' && !used[y + 1][x]) {
                area[y][x] = 'o';
                used[y + 1][x] = true;
                continue;
            }
            if (area[y][x] == '+' && area[y + 1][x] === ' ' && !used[y + 1][x]) {
                area[y][x] = '-';
                used[y + 1][x] = true;
                continue;
            }

            if (area[y][x] >= '0' && area[y][x] <= '3' && area[y + 1][x] === ' ' && !used[y + 1][x]) {
                area[y][x] = +area[y][x] + 4;
                used[y + 1][x] = true;
                continue;
            }
        }
    }

    go_players();
    go_player();

    for (var y = area.length - 2; y > 0; --y) {
        for (var x = 1; x < area[y].length - 1; ++x) {
            if (move[y][x] != standing) continue;
            if (area[y][x] == 'O' || area[y][x] == '+') {
                if (area[y + 1][x] == 'O' || area[y + 1][x] == '+' || area[y + 1][x] == '#' || area[y + 1][x] == 'b' || area[y + 1][x] == 'z') {
                    if (!used[y][x - 1] && !used[y + 1][x - 1] && area[y][x - 1] === ' ' && area[y + 1][x - 1] === ' ') {
                        area[y][x - 1] = (area[y][x] == 'O' ? 'O' : '+');
                        area[y][x] = ' ';
                        move[y][x - 1] = left;
                        used[y][x - 1] = true;
                        used[y + 1][x - 1] = true;
                        was_move = true;
                    } else if (!used[y][x + 1] && !used[y + 1][x + 1] && area[y][x + 1] === ' ' && area[y + 1][x + 1] === ' ') {
                        area[y][x + 1] = (area[y][x] == 'O' ? 'O' : '+');
                        area[y][x] = ' ';
                        move[y][x + 1] = right;
                        used[y][x + 1] = true;
                        used[y + 1][x + 1] = true;
                        was_move = true;
                    }
                }
            }
        }
    }

    return was_move;
}

function draw_info() {
    document.getElementById('gold').textContent = 'Золото: ' + (count_gold + cur_count_gold);
    document.getElementById('level').textContent = 'Уровень: ' + (number_level + 1);
    document.getElementById('time').textContent = 'Время: ' + time_game;
}

function get_sprite_image(object, x, y) {
    if (object == '#') {
        if (x == 0 || area[y][x - 1] != '#') {
            if (x + 1 == area[y].length || area[y][x + 1] != '#') {
                return (x & 1) ? wall_odd : wall_even;
            } else {
                return (x & 1) ? wall_odd_left : wall_even_left;
            }
        } else {
            if (x + 1 == area[y].length || area[y][x + 1] != '#') {
                return (x & 1) ? wall_odd_right : wall_even_right;
            } else {
                return (x & 1) ? wall_odd_middle : wall_even_middle;
            }
        }
    } else if (object == '.') return ground;
    else if (object == 'O' || object == 'o') return stone;
    else if (object == '+' || object == '-') return gold;
    else if (object == 'P') return player;
    else if (object == 'F') return flag;
    else if (object == 'b') return gblok;
    else if (object == 'z') return gblokcrash;
    else if (object == 'z1') return gblokcrash2;
    else if (object == '0' || object == '4') return cement;
    else if (object == '1' || object == '5') return cement2;
    else if (object == '2' || object == '6') return cement3;
    else if (object == '3' || object == '7') return cement4;

    return space;
}

function draw() {
    if (!area.length || !area[0]) return;

    update_camera();

    cntx.clearRect(0, 0, game.width, game.height);

    var start_x = camera_x;
    var start_y = camera_y;

    var end_x = Math.min(area[0].length, camera_x + camera_columns);
    var end_y = Math.min(area.length, camera_y + camera_rows);

    // Статичные объекты
    for (var y = start_y; y < end_y; y++) {
        for (var x = start_x; x < end_x; x++) {
            if (move[y][x] != standing) continue;

            var image_object = get_sprite_image(area[y][x], x, y);

            cntx.drawImage(
                image_object,
                (x - camera_x) * size_sprite,
                (y - camera_y) * size_sprite,
                size_sprite,
                size_sprite
            );
        }
    }

    // Движущиеся объекты
    for (var y = start_y; y < end_y; y++) {
        for (var x = start_x; x < end_x; x++) {
            if (move[y][x] == standing) continue;

            var image_object = get_sprite_image(area[y][x], x, y);

            var screen_x = Math.round(
                (x - camera_x) * size_sprite -
                (size_sprite / 6) *
                (5 - halfway) *
                dx[move[y][x]]
            );

            var screen_y = Math.round(
                (y - camera_y) * size_sprite -
                (size_sprite / 6) *
                (5 - halfway) *
                dy[move[y][x]]
            );

            cntx.drawImage(
                image_object,
                screen_x,
                screen_y,
                size_sprite+1,
                size_sprite+1
            );
        }
    }

    draw_info();
}

function move_player(direction, new_x, new_y, cur_x, cur_y) {
    if (area[new_y][new_x] == '+' || area[new_y][new_x] == '-') {
        audio_get_gold.play();
        ++cur_count_gold;
    } else {
        audio_move_player.play();
    }
    area[cur_y][cur_x] = ' ';
    area[new_y][new_x] = 'P';
    move[new_y][new_x] = direction;
}

function get_direction(e) {
    var code = e.code;
    if (code == 'ArrowLeft') return left;
    if (code == 'ArrowRight') return right;
    if (code == 'ArrowUp') return up;
    if (code == 'ArrowDown') return down;
    return standing;
}

/*
 * Источники направления хранятся отдельно: так отпускание одного пальца
 * не отменяет вторую всё ещё удерживаемую кнопку. Игра по-прежнему принимает
 * одно направление за кадр — используется последнее из активных направлений.
 */
var active_direction_sources = {};
var input_order = 0;
var active_pointers = {};
var mobileButtons = document.querySelectorAll('.control-btn');
var mobileDirections = { up: up, down: down, left: left, right: right };

function update_global_direction() {
    var latest = null;

    Object.keys(active_direction_sources).forEach(function (source) {
        var item = active_direction_sources[source];
        if (!latest || item.order > latest.order) {
            latest = item;
        }
    });

    global_direction = latest ? latest.direction : standing;
}

function press_direction(source, direction) {
    active_direction_sources[source] = {
        direction: direction,
        order: ++input_order
    };
    update_global_direction();
}

function release_direction(source) {
    if (active_direction_sources[source]) {
        delete active_direction_sources[source];
        update_global_direction();
    }
}

function button_has_active_pointer(button) {
    return Object.keys(active_pointers).some(function (pointerId) {
        return active_pointers[pointerId] === button;
    });
}

function release_pointer(pointerId) {
    var button = active_pointers[pointerId];
    if (!button) return;

    delete active_pointers[pointerId];
    release_direction('pointer-' + pointerId);

    if (!button_has_active_pointer(button)) {
        button.classList.remove('is-pressed');
    }
}

function reset_pressed_controls() {
    active_direction_sources = {};
    active_pointers = {};
    global_direction = standing;

    mobileButtons.forEach(function (button) {
        button.classList.remove('is-pressed');
    });
}

mobileButtons.forEach(function (button) {
    button.addEventListener('pointerdown', function (e) {
        // Правой кнопкой мыши не управляем, но принимаем все пальцы на тач-экране.
        if (e.pointerType === 'mouse' && e.button !== 0) return;

        e.preventDefault();
        var pointerId = e.pointerId;
        active_pointers[pointerId] = button;
        press_direction('pointer-' + pointerId, mobileDirections[button.dataset.direction]);
        button.classList.add('is-pressed');

        // Pointer Capture гарантирует pointerup даже за пределами кнопки.
        if (button.setPointerCapture) {
            try {
                button.setPointerCapture(pointerId);
            } catch (ignore) {
                // Некоторые браузеры не дают захватить указатель в редких случаях.
            }
        }
    }, { passive: false });

    function stop_moving(e) {
        if (e.cancelable) e.preventDefault();
        release_pointer(e.pointerId);
    }

    button.addEventListener('pointerup', stop_moving, { passive: false });
    button.addEventListener('pointercancel', stop_moving, { passive: false });
    button.addEventListener('lostpointercapture', stop_moving, { passive: false });
});

// Запасной путь для случаев, когда браузер отменил захват до доставки события кнопке.
document.addEventListener('pointerup', function (e) {
    release_pointer(e.pointerId);
}, { passive: true });
document.addEventListener('pointercancel', function (e) {
    release_pointer(e.pointerId);
}, { passive: true });

function restart_level() {
    reset_pressed_controls();
    moves.pop();
    load_level_to_area_and_area_old(number_level);
    draw();
}

function select_next_player() {
    reset_pressed_controls();
    if (moves.length < levels[number_level].player.length) {
        load_level_to_area_and_area_old(number_level);
        draw();
    }
}

function select_next_level() {
    reset_pressed_controls();
    next_level();
}

function run_keyboard_command(e) {
    if (e.code == 'Space') {
        select_next_player();
    }
    if (e.code == 'KeyN') {
        select_next_level();
    }
    if (e.code == 'KeyS') {
        reset_pressed_controls();
        count_gold -= cur_count_gold;
        --number_level;
        next_level();
    }
    if (e.code == 'KeyR') {
        restart_level();
    }
}

document.addEventListener('keydown', function (e) {
    if (e.code == 'Escape') {
        close_game_menu();
        return;
    }

    var cur_direction = get_direction(e);
    if (cur_direction !== standing) {
        e.preventDefault();
        // Автоповтор не должен делать клавишу «новее» другого удерживаемого ввода.
        if (!active_direction_sources['key-' + e.code]) {
            press_direction('key-' + e.code, cur_direction);
        }
        return;
    }

    if (e.code == 'Space') e.preventDefault();
    if (!e.repeat) run_keyboard_command(e);
});

document.addEventListener('keyup', function (e) {
    var cur_direction = get_direction(e);
    if (cur_direction !== standing) {
        e.preventDefault();
        release_direction('key-' + e.code);
    }
});

function go_players() {
    for (var i = 0; i + 1 < moves.length; i++) {
        while (
            index_moves[i] < time_game &&
            index_moves[i] < moves[i].length &&
            moves[i][index_moves[i]] == standing
        ) {
            ++index_moves[i];
        }

        if (index_moves[i] >= moves[i].length) continue;

        var direction = moves[i][index_moves[i]];
        var new_x = cur_x_players[i] + dx[direction];
        var new_y = cur_y_players[i] + dy[direction];
        var object = area[new_y][new_x];

        if (object == '#') return;

        if (object === ' ' || object == '.' || object == '+' || object == '-') {
            move_player(direction, new_x, new_y, cur_x_players[i], cur_y_players[i]);
            cur_x_players[i] = new_x;
            cur_y_players[i] = new_y;
            ++index_moves[i];
        } else if ((object == 'O' || (object >= '0' && object <= '1') || (object >= '4' && object <= '5')) && (direction == left || direction == right)) {
            var new_x_next = new_x + dx[direction];
            var new_y_next = new_y + dy[direction];

            if (area[new_y_next][new_x_next] === ' ' && !used[new_y_next][new_x_next]) {
                area[new_y_next][new_x_next] = object;
                move[new_y_next][new_x_next] = direction;
                used[new_y_next][new_x_next] = true;
                move_player(direction, new_x, new_y, cur_x_players[i], cur_y_players[i]);
                cur_x_players[i] = new_x;
                cur_y_players[i] = new_y;
                ++index_moves[i];
            }
        }
    }
}

function go_player() {
    var direction = global_direction;
    if (direction == standing) {
        cur_moves.push(standing);
        return;
    }

    var new_x = _cur_x + dx[direction];
    var new_y = _cur_y + dy[direction];
    var object = area[new_y][new_x];

    if (object == '#') {
        cur_moves.push(standing);
        return;
    }

    if (object == 'F') {
        cur_moves.push(direction);
        next_level();
        return;
    }

    if (object === ' ' || object == '.' || object == '+' || object == '-') {
        move_player(direction, new_x, new_y, _cur_x, _cur_y);
        cur_moves.push(direction);
        _cur_x = new_x;
        _cur_y = new_y;
    } else if ((object == 'O' || (object >= '0' && object <= '1') || (object >= '4' && object <= '5')) && (direction == left || direction == right)) {
        var new_x_next = new_x + dx[direction];
        var new_y_next = new_y + dy[direction];

        if (area[new_y_next][new_x_next] === ' ' && !used[new_y_next][new_x_next]) {
            area[new_y_next][new_x_next] = object;
            move[new_y_next][new_x_next] = direction;
            used[new_y_next][new_x_next] = true;
            move_player(direction, new_x, new_y, _cur_x, _cur_y);
            cur_moves.push(direction);
            _cur_x = new_x;
            _cur_y = new_y;
        } else {
            cur_moves.push(standing);
        }
    }
}

function go() {
    if (halfway == 0) {
        move_objects();
    }
    draw();
    if (++halfway == 6) {
        halfway = 0;
    }
}
draw();
setInterval(go, 1000 / 60);

/* Меню игры. Обычный click здесь оставлен намеренно: Fullscreen API требует
 * пользовательской активации, а у управляющих стрелок click-обработчиков нет. */
var menu_toggle = document.getElementById('menu-toggle');
var game_menu = document.getElementById('game-menu');
var game_menu_wrap = document.querySelector('.game-menu-wrap');
var fullscreen_button = document.getElementById('fullscreen');

function open_game_menu() {
    game_menu.hidden = false;
    menu_toggle.setAttribute('aria-expanded', 'true');
    menu_toggle.setAttribute('aria-label', 'Закрыть меню игры');
}

function close_game_menu() {
    game_menu.hidden = true;
    menu_toggle.setAttribute('aria-expanded', 'false');
    menu_toggle.setAttribute('aria-label', 'Открыть меню игры');
}

function toggle_game_menu() {
    if (game_menu.hidden) {
        open_game_menu();
    } else {
        close_game_menu();
    }
}

menu_toggle.addEventListener('click', function () {
    toggle_game_menu();
});

document.addEventListener('pointerdown', function (e) {
    if (!game_menu_wrap.contains(e.target)) {
        close_game_menu();
    }
});

document.getElementById('restart').addEventListener('click', function () {
    restart_level();
    close_game_menu();
});

document.getElementById('next-player').addEventListener('click', function () {
    select_next_player();
});

document.getElementById('next-level').addEventListener('click', function () {
    select_next_level();
    close_game_menu();
});

function toggle_fullscreen() {
    var container = document.documentElement;
    var is_fullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement);
    var request = container.requestFullscreen || container.webkitRequestFullscreen;
    var exit = document.exitFullscreen || document.webkitExitFullscreen;

    try {
        var result;
        if (is_fullscreen) {
            if (!exit) return;
            result = exit.call(document);
        } else {
            // На неподдерживающих браузерах просто ничего не делаем: игра остаётся доступной.
            if (!request) return;
            result = request.call(container);
        }

        if (result && result.catch) {
            result.catch(function (error) {
                console.warn('Полноэкранный режим недоступен:', error);
            });
        }
    } catch (error) {
        console.warn('Полноэкранный режим недоступен:', error);
    }
}

fullscreen_button.addEventListener('click', function () {
    toggle_fullscreen();
    close_game_menu();
});

function handleFullscreenChange() {
    var isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
    fullscreen_button.textContent = isFS ? 'Выйти из полноэкранного режима' : 'На весь экран';
    draw();
}

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

// Если вкладка/страница потеряла управление, оставшихся «зажатых» направлений быть не должно.
window.addEventListener('blur', reset_pressed_controls);
document.addEventListener('visibilitychange', function () {
    if (document.hidden) reset_pressed_controls();
});

window.addEventListener('resize', draw);
window.addEventListener('orientationchange', function () {
    setTimeout(draw, 100);
});
