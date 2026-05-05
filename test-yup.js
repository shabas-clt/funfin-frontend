const yup = require('yup');
const schema = yup.object({
  challengeDate: yup.date().nullable().typeError('Must be a valid date'),
  endDate: yup.date().nullable().typeError('Must be a valid date')
});

schema.validate({ challengeDate: '', endDate: '' })
  .then(res => console.log('success:', res))
  .catch(err => console.log('error:', err.errors));
