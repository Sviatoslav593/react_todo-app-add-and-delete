/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import { addTodos, deleteTodos, getTodos, USER_ID } from './api/todos';
import { TodoForm } from './components/TodoForm';
import { Todo } from './types/Todo';
import { TodoList } from './components/TodoList';
import { Footer } from './components/Footer';
import cn from 'classnames';
import { FilterField } from './types/enums/FilterField';
import { Selected } from './types/enums/Selected';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selected, setSelected] = useState<Selected>(Selected.all);

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [todoLoading, setTodoLoading] = useState(false);
  const [todoIdLoading, setTodoIdLoading] = useState<number | null>(null);

  const [filter, setFilter] = useState<FilterField>(FilterField.all);

  const [todosIdsLoading, setTodosIdsLoading] = useState<number[]>([]);

  const [visibleTodos, setVisibleTodos] = useState<Todo[]>([]);

  useEffect(() => {
    setVisibleTodos(
      todos.filter(todo => {
        if (filter === FilterField.completed) {
          return todo.completed;
        }

        if (filter === FilterField.active) {
          return !todo.completed;
        }

        return todos;
      }),
    );
  }, [filter, todos]);

  // const filteredTodos = todos.filter(todo => {
  //   if (filter === FilterField.completed) {
  //     return todo.completed;
  //   }

  //   if (filter === FilterField.active) {
  //     return !todo.completed;
  //   }

  //   return todos;
  // });

  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setErrorMessage('');

    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  useEffect(() => {
    if (errorMessage) {
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  }, [errorMessage]);

  const handleActiveTodosButton = () => {
    setSelected(Selected.active);
    setFilter(FilterField.active);
  };

  const handleCompletedTodosButton = () => {
    setSelected(Selected.completed);
    setFilter(FilterField.completed);
  };

  const handleAllTodosButton = () => {
    setSelected(Selected.all);
    setFilter(FilterField.all);
  };

  const addTodo = (title: string) => {
    setTodoLoading(true);
    setErrorMessage('');
    setTempTodo({
      id: 0,
      title: title,
      userId: USER_ID,
      completed: false,
    });

    return addTodos(title)
      .then(newTodo => setTodos(currentTodos => [...currentTodos, newTodo]))
      .catch(error => {
        setErrorMessage('Unable to add a todo');
        throw error;
      })
      .finally(() => {
        setTempTodo(null);
        setTodoLoading(false);
      });
  };

  const deleteTodo = (todoId: number) => {
    setTodoIdLoading(todoId);

    deleteTodos(todoId)
      .then(() => {
        setTodos(currentTodos => {
          return [...currentTodos.filter(todo => todo.id !== todoId)];
        });
      })
      .catch(error => {
        setErrorMessage('Unable to delete a todo');
        setTodos(todos);
        throw error;
      })
      .finally(() => {
        setTodoIdLoading(null);
      });
  };

  const handleAllActiveDelete = () => {
    setTodoLoading(true);

    const completedTodos = todos.filter(todo => todo.completed);

    setTodosIdsLoading(completedTodos.map(todo => todo.id));

    return Promise.all(
      completedTodos.map(todo =>
        deleteTodos(todo.id)
          .then(() => {
            setTodos(current => current.filter(t => t.id !== todo.id));
          })
          .catch(() => {
            setErrorMessage('Unable to delete a todo');
            setTodos(todos);
          }),
      ),
    ).finally(() => setTodosIdsLoading([]));
  };

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* Add a todo on form submit */}
          <TodoForm setError={setErrorMessage} onAdd={addTodo} />
        </header>
        {todos && errorMessage !== 'Unable to load todos' && (
          <TodoList
            tempTodo={tempTodo}
            isLoading={todoLoading}
            todoIdLoading={todoIdLoading}
            todos={visibleTodos}
            onDelete={deleteTodo}
            todosIdsLoading={todosIdsLoading}
          />
        )}

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <Footer
            handleActiveTodosButton={handleActiveTodosButton}
            handleCompletedTodosButton={handleCompletedTodosButton}
            handleAllTodosButton={handleAllTodosButton}
            todos={todos}
            selected={selected}
            handleAllActiveDelete={handleAllActiveDelete}
          />
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}

      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          {
            hidden: !errorMessage,
          },
        )}
      >
        <button
          onClick={() => setErrorMessage('')}
          data-cy="HideErrorButton"
          type="button"
          className="delete"
        />
        {/* show only one message at a time */}
        {errorMessage}
        <br />
        {/* Title should not be empty
            <br />
            Unable to add a todo
            <br />
            Unable to delete a todo
            <br />
            Unable to update a todo */}
      </div>
    </div>
  );
};
