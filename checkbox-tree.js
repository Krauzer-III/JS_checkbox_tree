(function (global) {
    'use strict';

    class CheckboxTree {
        /**
         * @param {string|HTMLElement} container
         * @param {Object} options
         * @param {Array<{ID:any, MaterialObjectTypeName:string, ParentID:any}>} options.data
         * @param {string} [options.name]
         * @param {'list'|'grid'} [options.layout='list']
         * @param {(selectedIds:Array)=>void} [options.onChange]
         */
        constructor(container, options = {}) {
            this.container =
                typeof container === 'string'
                    ? document.querySelector(container)
                    : container;

            if (!this.container) throw new Error('CheckboxTree: контейнер не найден');

            this.data = options.data || [];
            this.name = options.name || null;
            this.layout = options.layout === 'grid' ? 'grid' : 'list';
            this.onChange = options.onChange || (() => { });

            this.nodes = new Map();
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
                    this.roots.push(node);
                } else {
                    byId.get(node.parentId).children.push(node);
                }
            });

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
            this.container.classList.add('ctree--' + this.layout);

            const ul = document.createElement('ul');
            ul.className = 'ctree-root list-unstyled mb-0';

            this.roots.forEach((node) => ul.appendChild(this._renderNode(node)));
            this.container.appendChild(ul);
        }

        _toggleChildrenCheck(id) {
            const state = this.nodes.get(id);
            if (!state || !state.children.length) return;

            // Если хоть один потомок не отмечен — отмечаем всех, иначе снимаем всех
            const anyUnchecked = state.children.some(
                (c) => !this.nodes.get(c.id).checked
            );
            const target = anyUnchecked;

            state.children.forEach((child) =>
                this._setNodeChecked(child.id, target, { manual: true, cascade: true })
            );
        }

        _renderNode(node) {
            const state = this.nodes.get(node.id);
            const hasChildren = node.children.length > 0;

            const li = document.createElement('li');
            li.className = 'ctree-item';
            li.dataset.depth = node.depth;
            state.el = li;

            const row = document.createElement('div');
            row.className = 'ctree-row';
            row.style.setProperty('--ctree-indent', (node.depth * 24) + 'px');

            // --- Кнопка 1: свернуть / развернуть вложенные ---
            if (hasChildren) {
                const toggleBtn = document.createElement('button');
                toggleBtn.type = 'button';
                toggleBtn.className = 'btn btn-sm btn-outline-secondary ctree-btn ctree-toggle';
                toggleBtn.title = 'Свернуть / развернуть';
                toggleBtn.tabIndex = -1;
                toggleBtn.textContent = '▾';
                toggleBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._toggleChildren(node.id);
                });
                row.appendChild(toggleBtn);

                // --- Кнопка 2: отметить / снять всех вложенных ---
                const checkChildrenBtn = document.createElement('button');
                checkChildrenBtn.type = 'button';
                checkChildrenBtn.className = 'btn btn-sm btn-outline-secondary ctree-btn ctree-check-children';
                checkChildrenBtn.title = 'Отметить / снять вложенные';
                checkChildrenBtn.tabIndex = -1;
                checkChildrenBtn.textContent = '☑';
                checkChildrenBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._toggleChildrenCheck(node.id);
                });
                row.appendChild(checkChildrenBtn);
            } else {
                // Два спейсера — под обе кнопки, чтобы чекбоксы выравнивались
                const spacer1 = document.createElement('span');
                spacer1.className = 'ctree-spacer';
                row.appendChild(spacer1);
                const spacer2 = document.createElement('span');
                spacer2.className = 'ctree-spacer';
                row.appendChild(spacer2);
            }

            // --- Чекбокс самой ноды ---
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'form-check-input ctree-checkbox';
            checkbox.value = String(node.id);
            checkbox.id = 'ctree-cb-' + node.id;
            if (this.name) checkbox.name = this.name;
            checkbox.checked = state.checked;
            state.checkbox = checkbox;
            checkbox.addEventListener('change', () => {
                this._setNodeChecked(node.id, checkbox.checked, { manual: true, cascade: true });
            });

            const label = document.createElement('label');
            label.className = 'ctree-label form-check-label';
            label.setAttribute('for', checkbox.id);
            label.textContent = node.name;

            row.append(checkbox, label);
            li.appendChild(row);

            if (hasChildren) {
                const childUl = document.createElement('ul');
                childUl.className = 'ctree-children list-unstyled';
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
            const collapsed = childUl.classList.toggle('ctree-children--collapsed');
            const caret = state.el.querySelector('.ctree-toggle');
            if (caret) caret.textContent = collapsed ? '▸' : '▾';
        }

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

            // Каскад только вниз. Родитель — самостоятельная категория.
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
                .forEach((el) => el.classList.remove('ctree-children--collapsed'));
            this.container.querySelectorAll('.ctree-toggle').forEach((b) => {
                b.textContent = '▾';
            });
        }

        collapseAll() {
            this.container
                .querySelectorAll('.ctree-children')
                .forEach((el) => el.classList.add('ctree-children--collapsed'));
            this.container.querySelectorAll('.ctree-toggle').forEach((b) => {
                b.textContent = '▸';
            });
        }
    }

    global.CheckboxTree = CheckboxTree;
})(window);