import { Box, Badge } from '@admin-bro/design-system'

const displayMatchType = props => {
  return (
    <Box>
      { props.record.params.type === 'SWIPE' && <Badge variant={'success'}>{ props.record.params.type }</Badge> }
      { props.record.params.type === 'WAVE' && <Badge variant={'primary'}>{ props.record.params.type }</Badge> }
      { props.record.params.type === 'DIRECT_MESSAGE' && <Badge variant={'secondary'}>{ props.record.params.type }</Badge> }
    </Box>
  );
};

export default displayMatchType