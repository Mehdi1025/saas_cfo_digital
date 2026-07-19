<?php

namespace App\Encryption;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Encryption\Encrypter as BaseEncrypter;

class Encrypter extends BaseEncrypter
{
    /**
     * @param  string  $payload
     * @param  bool  $unserialize
     * @return mixed
     */
    public function decrypt($payload, $unserialize = true)
    {
        $payload = $this->getJsonPayload($payload);

        $iv = base64_decode($payload['iv']);

        $this->ensureTagIsValid(
            $tag = empty($payload['tag']) ? null : base64_decode($payload['tag'])
        );

        $foundValidMac = false;
        $isAead = in_array(strtolower($this->cipher), ['aes-128-gcm', 'aes-256-gcm'], true);

        foreach ($this->getAllKeys() as $key) {
            if (
                $this->shouldValidateMac() &&
                ! ($foundValidMac = $foundValidMac || $this->validMacForKey($payload, $key))
            ) {
                continue;
            }

            $decrypted = $isAead
                ? \openssl_decrypt($payload['value'], strtolower($this->cipher), $key, 0, $iv, $tag ?? '')
                : \openssl_decrypt($payload['value'], strtolower($this->cipher), $key, 0, $iv);

            if ($decrypted !== false) {
                break;
            }
        }

        if ($this->shouldValidateMac() && ! $foundValidMac) {
            throw new DecryptException('The MAC is invalid.');
        }

        if (($decrypted ?? false) === false) {
            throw new DecryptException('Could not decrypt the data.');
        }

        return $unserialize ? unserialize($decrypted) : $decrypted;
    }
}
