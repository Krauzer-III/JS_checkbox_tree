(function (global) {
    'use strict';

    class CheckboxTree {
        /**
         * @param {string|HTMLElement} container
         * @param {Object} options
         * @param {Array<{ID:any, MaterialObjectTypeName:string, ParentID:any}>} options.data
         * @param {(selectedIds:Array)=>void} [options.onChange]
         */
        constructor(container, options = {}) {
            this.container =
                typeof container === 'string'
                    ? document.querySelector(container)
                    : container;

            if (!this.container) throw new Error('CheckboxTree: контейнер не найден');

            this.data = options.data || [];
            this.onChange = options.onChange || (() => { });

            /** @type {Map<any, {node, children, checked, el, checkbox}>} */
            this.nodes = new Map();

            /** @type {Set<any>} ID, отмеченные пользователем явно */
            this.manualChecked = new Set();

            this._buildModel();
            this._render();
        }

        // ---------- Модель ----------

        _buildModel() {
            const byId = new Map();

            this.data.forEach((row) => {
                byId.set(row.ID, {
                    id: row.ID,
                    name: row.MaterialObjectTypeName,
                    parentId: row.ParentID,
                    children: [],
                    depth: 0,
                });
            });

            this.roots = [];
            byId.forEach((node) => {
                if (node.parentId == null || !byId.has(node.parentId)) {
                    node.depth = 0;
                    this.roots.push(node);
                } else {
                    const parent = byId.get(node.parentId);
                    node.depth = parent.depth + 1;
                    parent.children.push(node);
                }
            });

            // На случай, если данные пришли не отсортированные — пересчитаем глубину рекурсивно
            const setDepth = (node, depth) => {
                node.depth = depth;
                node.children.forEach((c) => setDepth(c, depth + 1));
            };
            this.roots.forEach((r) => setDepth(r, 0));

            byId.forEach((node, id) => {
                this.nodes.set(id, {
                    node,
                    children: node.children,
                    checked: false,
                    el: null,
                    checkbox: null,
                });
            });
        }

        // ---------- Рендер ----------

        _render() {
            this.container.innerHTML = '';
            this.container.classList.add('ctree');

            const ul = document.createElement('ul');
            ul.className = 'ctree-root';

            this.roots.forEach((node) => ul.appendChild(this._renderNode(node)));
            this.container.appendChild(ul);
        }

        _renderNode(node) {
            const state = this.nodes.get(node.id);
            const hasChildren = node.children.length > 0;

            const li = document.createElement('li');
            li.className = 'ctree-item';
            state.el = li;

            const row = document.createElement('div');
            row.className = 'ctree-row';

            // Кнопка 1: свернуть/развернуть вложенные
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'ctree-btn ctree-toggle';
            toggleBtn.title = 'Свернуть / развернуть';
            toggleBtn.textContent = hasChildren ? '▾' : '';
            toggleBtn.disabled = !hasChildren;
            if (!hasChildren) toggleBtn.classList.add('ctree-btn--empty');
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleChildren(node.id);
            });

            // Кнопка 2: отметить/снять вложенные
            const checkChildrenBtn = document.createElement('button');
            checkChildrenBtn.type = 'button';
            checkChildrenBtn.className = 'ctree-btn ctree-check-children';
            checkChildrenBtn.title = 'Отметить / снять вложенные';
            checkChildrenBtn.textContent = '☑';
            checkChildrenBtn.disabled = !hasChildren;
            if (!hasChildren) checkChildrenBtn.classList.add('ctree-btn--empty');
            checkChildrenBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleChildrenCheck(node.id);
            });

            // Чекбокс самой ноды
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'ctree-checkbox';
            checkbox.checked = state.checked;
            state.checkbox = checkbox;
            checkbox.addEventListener('change', () => {
                this._setNodeChecked(node.id, checkbox.checked, { manual: true, cascade: true });
            });

            const label = document.createElement('span');
            label.className = 'ctree-label';
            label.textContent = node.name;
            label.title = `${node.name} (ID: ${node.id})`;
            label.addEventListener('click', () => {
                this._setNodeChecked(node.id, !state.checked, { manual: true, cascade: true });
            });

            row.append(toggleBtn, checkChildrenBtn, checkbox, label);
            li.appendChild(row);

            if (hasChildren) {
                const childUl = document.createElement('ul');
                childUl.className = 'ctree-children';
                node.children.forEach((child) =>
                    childUl.appendChild(this._renderNode(child))
                );
                li.appendChild(childUl);
            }

            return li;
        }

        // ---------- Управление ----------

        _toggleChildren(id) {
            const state = this.nodes.get(id);
            if (!state) return;
            const childUl = state.el.querySelector(':scope > .ctree-children');
            if (!childUl) return;
            const collapsed = childUl.style.display === 'none';
            childUl.style.display = collapsed ? '' : 'none';
            const btn = state.el.querySelector('.ctree-toggle');
            if (btn) btn.textContent = collapsed ? '▾' : '▸';
        }

        _toggleChildrenCheck(id) {
            const state = this.nodes.get(id);
            if (!state || !state.children.length) return;

            // Если хоть один потомок не отмечен — отмечаем всех. Иначе — снимаем всех.
            const anyUnchecked = state.children.some(
                (c) => !this.nodes.get(c.id).checked
            );
            const target = anyUnchecked;

            state.children.forEach((child) =>
                this._setNodeChecked(child.id, target, { manual: true, cascade: true })
            );
        }

        /**
         * Установить состояние узла.
         * ВАЖНО: изменение состояния детей НЕ снимает/ставит автоматически
         * состояние родителя. Родитель — самостоятельная категория.
         */
        _setNodeChecked(id, checked, opts = {}) {
            const state = this.nodes.get(id);
            if (!state) return;

            const { manual = false, cascade = true } = opts;

            state.checked = checked;
            if (state.checkbox) state.checkbox.checked = checked;

            if (manual) {
                if (checked) this.manualChecked.add(id);
                else this.manualChecked.delete(id);
            }

            // Каскад только вниз: отметили родителя — отметились все дети.
            if (cascade) {
                state.children.forEach((child) =>
                    this._setNodeChecked(child.id, checked, { manual, cascade: true })
                );
            }

            this._emitChange();
        }

        _emitChange() {
            if (typeof this.onChange === 'function') {
                this.onChange(this.getSelected());
            }
        }

        // ---------- Публичный API ----------

        getSelected() {
            const result = [];
            this.nodes.forEach((state, id) => {
                if (state.checked) result.push(id);
            });
            return result;
        }

        getManuallySelected() {
            return Array.from(this.manualChecked);
        }

        setChecked(ids, checked = true) {
            ids.forEach((id) =>
                this._setNodeChecked(id, checked, { manual: true, cascade: true })
            );
        }

        checkAll(checked = true) {
            this.nodes.forEach((_, id) =>
                this._setNodeChecked(id, checked, { manual: true, cascade: true })
            );
        }

        expandAll() {
            this.container
                .querySelectorAll('.ctree-children')
                .forEach((el) => (el.style.display = ''));
            this.container.querySelectorAll('.ctree-toggle').forEach((btn) => {
                if (!btn.disabled) btn.textContent = '▾';
            });
        }

        collapseAll() {
            this.container
                .querySelectorAll('.ctree-children')
                .forEach((el) => (el.style.display = 'none'));
            this.container.querySelectorAll('.ctree-toggle').forEach((btn) => {
                if (!btn.disabled) btn.textContent = '▸';
            });
        }
    }

    global.CheckboxTree = CheckboxTree;
})(window);