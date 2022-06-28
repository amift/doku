import React, { useReducer } from 'react';
import { Container, Statistic, Table, Icon, Message, Grid, Header } from 'semantic-ui-react';
import { useSelector } from 'react-redux';
import { selectDockerBindMounts, selectDockerBindMountsStatus } from '../AppSlice';
import { CHANGE_SORT, sortReducer, sortReducerInitializer } from '../util/sort';
import statusPage from './StatusPage';
import { sortBy } from 'lodash/collection';
import { prettyTime, replaceWithNbsp } from '../util/fmt';
import prettyBytes from 'pretty-bytes';
import { findIndex } from 'lodash/array';

function BindMounts() {
  const bindMounts = useSelector(selectDockerBindMounts);
  const bindMountsStatus = useSelector(selectDockerBindMountsStatus);
  const [state, dispatch] = useReducer(sortReducer, sortReducerInitializer());

  const s = statusPage(bindMounts, bindMountsStatus);
  if (s !== null) {
    return s;
  }

  let dataTable = null;

  if (Array.isArray(bindMounts.BindMounts) && bindMounts.BindMounts.length > 0) {
    const { column, direction } = state;
    const data = sortBy(bindMounts.BindMounts, [column]);
    if (direction === 'descending') {
      data.reverse();
    }
    const customView = (prepared, err, value) => {
      if (!prepared) return <Icon loading name="spinner" />;
      if (err.length > 0) return '-'; // error
      return value;
    };

    dataTable = (
      <Table selectable sortable celled compact size="small">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell sorted={column === 'Path' ? direction : null} onClick={() => dispatch({ type: CHANGE_SORT, column: 'Path' })}>
              Path
            </Table.HeaderCell>
            <Table.HeaderCell
              textAlign="right"
              sorted={column === 'Size' ? direction : null}
              onClick={() => dispatch({ type: CHANGE_SORT, column: 'Size' })}>
              Size
            </Table.HeaderCell>
            <Table.HeaderCell
              textAlign="right"
              sorted={column === 'Files' ? direction : null}
              onClick={() => dispatch({ type: CHANGE_SORT, column: 'Files' })}>
              Files
            </Table.HeaderCell>
            <Table.HeaderCell
              textAlign="center"
              sorted={column === 'ReadOnly' ? direction : null}
              onClick={() => dispatch({ type: CHANGE_SORT, column: 'ReadOnly' })}>
              Read Only
            </Table.HeaderCell>
            <Table.HeaderCell
              textAlign="center"
              sorted={column === 'LastCheck' ? direction : null}
              onClick={() => dispatch({ type: CHANGE_SORT, column: 'LastCheck' })}>
              Last Check
            </Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data.map(({ Path, Size, IsDir, Files, ReadOnly, LastCheck, Prepared, Err }) => (
            <Table.Row key={Path}>
              <Table.Cell>{Path}</Table.Cell>
              <Table.Cell textAlign="right">{customView(Prepared, Err, replaceWithNbsp(prettyBytes(Size)))}</Table.Cell>
              <Table.Cell textAlign="right">{customView(Prepared, Err, IsDir ? Files : 1)}</Table.Cell>
              <Table.Cell textAlign="center">{ReadOnly ? 'yes' : 'no'}</Table.Cell>
              <Table.Cell textAlign="center">{prettyTime(LastCheck)}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    );
  }

  const showWarning = bindMounts.BindMounts && Array.isArray(bindMounts.BindMounts) && findIndex(bindMounts.BindMounts, (m) => m.Err) > -1;

  return (
    <Container>
      <Grid columns={2}>
        <Grid.Row>
          <Grid.Column>
            <Statistic>
              <Statistic.Label>Total size</Statistic.Label>
              <Statistic.Value>{replaceWithNbsp(prettyBytes(bindMounts.TotalSize))}</Statistic.Value>
            </Statistic>
          </Grid.Column>
          <Grid.Column textAlign="right" verticalAlign="bottom">
            <Header>Bind Mounts</Header>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      {showWarning ? <NoAccessWarning /> : null}
      {dataTable}
    </Container>
  );
}

function NoAccessWarning() {
  return (
    <Message warning size="tiny">
      <Message.Content>
        <Message.Header>
          <code>{'No access to some mounted files or directories'}</code>
        </Message.Header>
        {"Doku doesn't have access to some mounted files or directories and can't calculate the size of these files."}
      </Message.Content>
    </Message>
  );
}

export default BindMounts;
